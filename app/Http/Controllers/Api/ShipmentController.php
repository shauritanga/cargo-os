<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySettings;
use App\Models\Shipment;
use App\Services\ShipmentLifecycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Milon\Barcode\Facades\DNS1DFacade as DNS1D;

class ShipmentController extends Controller
{
    public function __construct(private readonly ShipmentLifecycleService $lifecycle) {}

    public function index(Request $request): JsonResponse
    {
        $query = Shipment::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($b) use ($q) {
                $b->where('awb_number', 'like', "%{$q}%")
                    ->orWhere('customer', 'like', "%{$q}%")
                    ->orWhere('origin', 'like', "%{$q}%")
                    ->orWhere('dest', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'           => 'required|in:international,domestic',
            'origin'         => 'required|string|max:255',
            'origin_country' => 'nullable|string|max:10',
            'dest'           => 'required|string|max:255',
            'dest_country'   => 'nullable|string|max:10',
            'customer'       => 'required|string|max:255',
            'weight'         => 'nullable|numeric|min:0',
            'mode'           => 'required|in:Sea,Air,Road,Rail',
            'cargo_type'     => 'required|string',
            'eta'            => 'nullable|date',
            'contact'        => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:50',
            'notes'          => 'nullable|string',
            'declared_value' => 'nullable|string|max:100',
            'insurance'      => 'nullable|string|max:100',
            'pieces'         => 'nullable|integer|min:1',
            'contents'       => 'nullable|string|max:500',
            'consignor'      => 'nullable|array',
            'consignee'      => 'nullable|array',
        ]);

        $shipment = DB::transaction(function () use ($validated, $request) {
            $awbNumber = CompanySettings::nextAwbNumber();
            $shipment = Shipment::create(array_merge($validated, [
                'awb_number' => $awbNumber,
                'status'     => 'pending',
            ]));

            $this->lifecycle->recordInitialEvent($shipment, $request->user(), [
                'source' => 'shipment_create',
            ]);

            return $shipment;
        });

        return response()->json($shipment, 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Shipment::findOrFail($id));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $shipment = Shipment::findOrFail($id);

        $isFullUpdate = $request->isMethod('put');
        $presence = $isFullUpdate ? 'required' : 'sometimes';

        $validated = $request->validate([
            'type'            => "{$presence}|in:international,domestic",
            'origin'          => "{$presence}|string|max:255",
            'origin_country'  => "{$presence}|nullable|string|max:10",
            'dest'            => "{$presence}|string|max:255",
            'dest_country'    => "{$presence}|nullable|string|max:10",
            'customer'        => "{$presence}|string|max:255",
            'weight'          => "{$presence}|nullable|numeric|min:0",
            'mode'            => "{$presence}|in:Sea,Air,Road,Rail",
            'cargo_type'      => "{$presence}|string",
            'status'         => 'sometimes|in:transit,delivered,pending,delayed,customs',
            'reason'         => 'sometimes|nullable|string|max:2000',
            'override'       => 'sometimes|boolean',
            'override_reason' => 'sometimes|nullable|string|max:2000',
            'occurred_at'    => 'required_with:status|date',
            'recipient_name' => 'required_if:status,delivered|nullable|string|max:255',
            'recipient_phone' => 'required_if:status,delivered|nullable|string|max:50',
            'eta'             => "{$presence}|nullable|date",
            'notes'           => "{$presence}|nullable|string",
            'contact'         => "{$presence}|nullable|string|max:255",
            'email'           => "{$presence}|nullable|email|max:255",
            'phone'           => "{$presence}|nullable|string|max:50",
            'declared_value'  => "{$presence}|nullable|string|max:100",
            'insurance'       => "{$presence}|nullable|string|max:100",
            'pieces'          => "{$presence}|nullable|integer|min:1",
            'contents'        => "{$presence}|nullable|string|max:500",
            'consignor'       => "{$presence}|nullable|array",
            'consignee'       => "{$presence}|nullable|array",
        ]);

        if (array_key_exists('status', $validated)) {
            $shipment = $this->lifecycle->transition(
                $shipment,
                (string) $validated['status'],
                Arr::only($validated, ['reason', 'override', 'override_reason', 'occurred_at', 'recipient_name', 'recipient_phone']),
                $request->user(),
            );
        }

        $attributes = Arr::only($validated, [
            'type',
            'origin',
            'origin_country',
            'dest',
            'dest_country',
            'customer',
            'weight',
            'mode',
            'cargo_type',
            'eta',
            'notes',
            'contact',
            'email',
            'phone',
            'declared_value',
            'insurance',
            'pieces',
            'contents',
            'consignor',
            'consignee',
        ]);

        if ($attributes !== []) {
            if ($shipment->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending shipments can be edited.',
                ], 422);
            }

            $shipment->update($attributes);
            $shipment = $shipment->fresh();
        }

        return response()->json($shipment);
    }

    public function destroy(string $id): JsonResponse
    {
        Shipment::findOrFail($id)->delete();
        return response()->json(['message' => 'Shipment deleted']);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:transit,delivered,pending,delayed,customs',
            'reason' => 'sometimes|nullable|string|max:2000',
            'override' => 'sometimes|boolean',
            'override_reason' => 'sometimes|nullable|string|max:2000',
            'occurred_at' => 'required|date',
            'recipient_name' => 'required_if:status,delivered|nullable|string|max:255',
            'recipient_phone' => 'required_if:status,delivered|nullable|string|max:50',
        ]);

        $shipment = Shipment::findOrFail($id);
        $shipment = $this->lifecycle->transition(
            $shipment,
            (string) $validated['status'],
            Arr::only($validated, ['reason', 'override', 'override_reason', 'occurred_at', 'recipient_name', 'recipient_phone']),
            $request->user(),
        );

        return response()->json($shipment);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:shipments,id',
            'status' => 'required|in:transit,delivered,pending,delayed,customs',
            'reason' => 'sometimes|nullable|string|max:2000',
            'override' => 'sometimes|boolean',
            'override_reason' => 'sometimes|nullable|string|max:2000',
            'occurred_at' => 'required|date',
            'recipient_name' => 'required_if:status,delivered|nullable|string|max:255',
            'recipient_phone' => 'required_if:status,delivered|nullable|string|max:50',
        ]);

        $result = $this->lifecycle->bulkTransition(
            array_map('intval', $validated['ids']),
            (string) $validated['status'],
            Arr::only($validated, ['reason', 'override', 'override_reason', 'occurred_at', 'recipient_name', 'recipient_phone']),
            $request->user(),
        );

        return response()->json([
            'message' => 'Bulk lifecycle update processed.',
            'updated' => $result['updated'],
            'failed' => $result['failed'],
            'total' => $result['total'],
        ]);
    }

    public function events(string $id): JsonResponse
    {
        $shipment = Shipment::findOrFail($id);

        return response()->json(
            $shipment->statusEvents()
                ->with('user:id,name,email')
                ->orderByDesc('occurred_at')
                ->get()
        );
    }

    public function barcode(string $code)
    {
        $payload = $code;
        if (ctype_digit($code)) {
            $shipment = Shipment::find((int) $code);
            if ($shipment) {
                $tokenize = static function (?string $value, int $limit): string {
                    $safe = mb_strtoupper((string) $value);
                    $safe = preg_replace('/[^A-Z0-9]/', '', $safe) ?? '';
                    return mb_substr($safe, 0, $limit);
                };

                $awb = $tokenize((string) ($shipment->awb_number ?: $shipment->id), 16);
                $origin = $tokenize((string) $shipment->origin, 4);
                $dest = $tokenize((string) $shipment->dest, 4);
                $customer = $tokenize((string) $shipment->customer, 6);
                $mode = $tokenize((string) $shipment->mode, 1);
                $weight = is_numeric($shipment->weight)
                    ? rtrim(rtrim(number_format((float) $shipment->weight, 1, '.', ''), '0'), '.')
                    : '';
                $created = $shipment->created_at?->format('ymdHi') ?? now()->format('ymdHi');

                $payload = sprintf(
                    'SHP|%s|O%s|D%s|C%s|M%s|W%s|T%s',
                    $awb,
                    $origin,
                    $dest,
                    $customer,
                    $mode,
                    $weight,
                    $created,
                );
            }
        }

        $svg = DNS1D::getBarcodeSVG($payload, 'C128', 3, 72, 'black', false);

        return response($svg, 200)
            ->header('Content-Type', 'image/svg+xml')
            ->header('Cache-Control', 'private, max-age=300');
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array']);
        $count = Shipment::whereIn('id', $request->ids)->delete();
        return response()->json(['message' => 'Bulk delete applied', 'count' => $count]);
    }

    public function exportCsv(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="shipments.csv"',
        ];

        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['AWB', 'Type', 'Origin', 'Destination', 'Customer', 'Weight', 'Mode', 'Status', 'ETA']);
            Shipment::orderByDesc('created_at')->chunk(200, function ($shipments) use ($out) {
                foreach ($shipments as $s) {
                    fputcsv($out, [
                        $this->sanitizeCsvValue($s->awb_number),
                        $this->sanitizeCsvValue($s->type),
                        $this->sanitizeCsvValue($s->origin),
                        $this->sanitizeCsvValue($s->dest),
                        $this->sanitizeCsvValue($s->customer),
                        $this->sanitizeCsvValue($s->weight),
                        $this->sanitizeCsvValue($s->mode),
                        $this->sanitizeCsvValue($s->status),
                        $this->sanitizeCsvValue($s->eta?->format('Y-m-d')),
                    ]);
                }
            });
            fclose($out);
        }, 'shipments.csv', $headers);
    }

    private function sanitizeCsvValue(mixed $value): string
    {
        $string = trim((string) ($value ?? ''));

        if ($string !== '' && preg_match('/^[=+\-@\t\r]/', $string) === 1) {
            return "'{$string}";
        }

        return $string;
    }
}
