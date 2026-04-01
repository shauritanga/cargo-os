<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Booking;
use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PublicBookingController extends Controller
{
    public function showForm(): View
    {
        $countries = Country::query()
            ->orderBy('name')
            ->get(['name', 'code']);

        $countryOptions = $countries
            ->map(fn(Country $country) => [
                'label' => $country->name,
                'value' => $country->code,
                'code' => $country->code,
            ])
            ->values();

        return view('public-booking', [
            'countries' => $countries,
            'countryOptions' => $countryOptions,
        ]);
    }

    public function cities(string $code): JsonResponse
    {
        $country = Country::query()
            ->where('code', strtoupper($code))
            ->first();

        if (!$country) {
            return response()->json([]);
        }

        return response()->json(
            $country->cities()->pluck('name')->values()
        );
    }

    public function submit(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:50',
            'origin' => 'required|string|max:255',
            'origin_country' => 'nullable|string|max:10',
            'dest' => 'required|string|max:255',
            'dest_country' => 'nullable|string|max:10',
            'shipment_type' => 'required|in:international,domestic',
            'mode' => 'required|in:Road,Air',
            'cargo_type' => 'required|string|max:100',
            'urgency' => 'required|in:high,medium,low',
            'pieces' => 'nullable|integer|min:1',
            'weight' => 'nullable|numeric|min:0',
            'contents' => 'nullable|string|max:500',
            'eta' => 'nullable|date',
            'notes' => 'nullable|string|max:2000',
            'website' => 'nullable|string|max:10',
        ]);

        // Honeypot field to reduce bot submissions.
        if (!empty($validated['website'])) {
            return redirect()
                ->route('public.booking.form')
                ->with('booking_success', 'Your request has been received.');
        }

        Booking::create([
            'branch_id' => Branch::resolveDefaultId(),
            'customer' => $validated['company_name'],
            'origin' => $validated['origin'],
            'dest' => $validated['dest'],
            'mode' => $validated['mode'],
            'type' => $validated['cargo_type'],
            'weight' => $validated['weight'] ?? 1,
            'containers' => $validated['pieces'] ?? 1,
            'urgency' => $validated['urgency'],
            'status' => 'new',
            'contact' => $validated['contact_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'message' => trim(implode("\n", array_filter([
                'Public website booking request',
                'Shipment Type: ' . $validated['shipment_type'],
                'Origin Country: ' . ($validated['origin_country'] ?: 'TZ'),
                'Destination Country: ' . ($validated['dest_country'] ?: 'TZ'),
                'Preferred ETA: ' . ($validated['eta'] ?? 'N/A'),
                'Contents: ' . ($validated['contents'] ?? 'N/A'),
            ]))),
            'notes' => $validated['notes'] ?? '',
            'converted_to' => null,
            'assigned_to' => null,
        ]);

        return redirect()
            ->route('public.booking.form')
            ->with('booking_success', 'Thanks, your booking request has been submitted. We will contact you shortly.');
    }
}
