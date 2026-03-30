<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CompanySettings;
use App\Models\Shipment;
use App\Services\ShipmentLifecycleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function __construct(private readonly ShipmentLifecycleService $lifecycle) {}

    public function index(Request $request): JsonResponse
    {
        $query = Booking::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($builder) use ($q) {
                $builder->where('customer', 'like', "%{$q}%")
                    ->orWhere('origin', 'like', "%{$q}%")
                    ->orWhere('dest', 'like', "%{$q}%")
                    ->orWhere('contact', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer'   => 'required|string|max:255',
            'origin'     => 'required|string|max:255',
            'dest'       => 'required|string|max:255',
            'mode'       => 'required|in:Sea,Air,Road,Rail',
            'type'       => 'required|string|max:100',
            'weight'     => 'required|numeric|min:0',
            'containers' => 'required|integer|min:1',
            'urgency'    => 'required|in:high,medium,low',
            'contact'    => 'nullable|string|max:255',
            'email'      => 'nullable|email|max:255',
            'phone'      => 'nullable|string|max:50',
            'message'    => 'nullable|string|max:2000',
            'assigned_to' => 'nullable|string|max:255',
            'notes'      => 'nullable|string|max:2000',
        ]);

        $booking = Booking::create(array_merge($validated, [
            'status' => 'new',
            'converted_to' => null,
        ]));

        return response()->json($booking, 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Booking::findOrFail($id));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        $validated = $request->validate([
            'customer'    => 'sometimes|required|string|max:255',
            'origin'      => 'sometimes|required|string|max:255',
            'dest'        => 'sometimes|required|string|max:255',
            'mode'        => 'sometimes|required|in:Sea,Air,Road,Rail',
            'type'        => 'sometimes|required|string|max:100',
            'weight'      => 'sometimes|required|numeric|min:0',
            'containers'  => 'sometimes|required|integer|min:1',
            'urgency'     => 'sometimes|required|in:high,medium,low',
            'status'      => 'sometimes|required|in:new,reviewing,approved,converted,rejected',
            'contact'     => 'sometimes|nullable|string|max:255',
            'email'       => 'sometimes|nullable|email|max:255',
            'phone'       => 'sometimes|nullable|string|max:50',
            'message'     => 'sometimes|nullable|string|max:2000',
            'assigned_to' => 'sometimes|nullable|string|max:255',
            'notes'       => 'sometimes|nullable|string|max:2000',
        ]);

        $booking->update($validated);

        return response()->json($booking->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        Booking::findOrFail($id)->delete();
        return response()->json(['message' => 'Booking deleted']);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:new,reviewing,approved,converted,rejected']);
        $booking = Booking::findOrFail($id);

        if ($request->status === 'rejected') {
            $this->ensureBookingEmail($booking);

            DB::transaction(function () use ($booking) {
                $booking->update(['status' => 'rejected']);
                $this->sendRejectedEmail($booking->fresh());
            });

            return response()->json($booking->fresh());
        }

        $booking->update(['status' => $request->status]);

        return response()->json($booking->fresh());
    }

    public function convert(Request $request, string $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);
        $this->ensureBookingEmail($booking);

        if ($booking->status === 'converted' && !empty($booking->converted_to)) {
            return response()->json($booking);
        }

        DB::transaction(function () use ($booking, $request) {
            $awbNumber = CompanySettings::nextAwbNumber();

            $shipment = Shipment::create([
                'awb_number' => $awbNumber,
                'type' => 'domestic',
                'origin' => $booking->origin,
                'origin_country' => 'TZ',
                'dest' => $booking->dest,
                'dest_country' => 'TZ',
                'customer' => $booking->customer,
                'weight' => $booking->weight,
                'mode' => $booking->mode,
                'cargo_type' => $booking->type,
                'status' => 'pending',
                'contact' => $booking->contact,
                'email' => $booking->email,
                'phone' => $booking->phone,
                'notes' => trim("Converted from booking #{$booking->id}\n" . ($booking->notes ?? '')),
                'pieces' => $booking->containers,
                'contents' => $booking->message,
            ]);

            $this->lifecycle->recordInitialEvent($shipment, $request->user(), [
                'source' => 'booking_convert',
                'booking_id' => $booking->id,
            ]);

            $booking->update([
                'status' => 'converted',
                'converted_to' => $awbNumber,
            ]);

            $this->sendConvertedEmail($booking->fresh());
        });

        return response()->json($booking->fresh());
    }

    private function ensureBookingEmail(Booking $booking): void
    {
        if (empty($booking->email)) {
            throw ValidationException::withMessages([
                'email' => 'Booking has no customer email. Please add an email before this action.',
            ]);
        }
    }

    private function sendConvertedEmail(Booking $booking): void
    {
        $recipientName = $booking->contact ?: $booking->customer;

        $message = implode("\n", [
            "Dear {$recipientName},",
            '',
            "Your booking #{$booking->id} has been converted into an active shipment.",
            "Tracking Number (AWB): {$booking->converted_to}",
            "Route: {$booking->origin} to {$booking->dest}",
            "Mode: {$booking->mode}",
            '',
            'Thank you for choosing us.',
        ]);

        Mail::raw($message, function ($mail) use ($booking) {
            $mail->to($booking->email, $booking->contact ?: $booking->customer)
                ->subject("Booking {$booking->id} Converted to Shipment");
        });
    }

    private function sendRejectedEmail(Booking $booking): void
    {
        $recipientName = $booking->contact ?: $booking->customer;
        $reason = trim((string) $booking->notes);

        $lines = [
            "Dear {$recipientName},",
            '',
            "We regret to inform you that booking #{$booking->id} has been rejected.",
            "Route: {$booking->origin} to {$booking->dest}",
            "Mode: {$booking->mode}",
        ];

        if ($reason !== '') {
            $lines[] = "Reason: {$reason}";
        }

        $lines[] = '';
        $lines[] = 'If you need assistance, please contact our support team.';

        Mail::raw(implode("\n", $lines), function ($mail) use ($booking) {
            $mail->to($booking->email, $booking->contact ?: $booking->customer)
                ->subject("Booking {$booking->id} Rejected");
        });
    }
}
