<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySettings;
use App\Models\Shipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShipmentController extends Controller
{
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
                $b->where('awb_number', 'ilike', "%{$q}%")
                  ->orWhere('customer', 'ilike', "%{$q}%")
                  ->orWhere('origin', 'ilike', "%{$q}%")
                  ->orWhere('dest', 'ilike', "%{$q}%");
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

        $shipment = DB::transaction(function () use ($validated) {
            $awbNumber = CompanySettings::nextAwbNumber();
            return Shipment::create(array_merge($validated, [
                'awb_number' => $awbNumber,
                'status'     => 'pending',
            ]));
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
        $shipment->update($request->validate([
            'status'         => 'sometimes|in:transit,delivered,pending,delayed,customs',
            'eta'            => 'sometimes|nullable|date',
            'notes'          => 'sometimes|nullable|string',
            'contact'        => 'sometimes|nullable|string',
            'email'          => 'sometimes|nullable|email',
            'phone'          => 'sometimes|nullable|string',
            'declared_value' => 'sometimes|nullable|string',
            'insurance'      => 'sometimes|nullable|string',
        ]));

        return response()->json($shipment);
    }

    public function destroy(string $id): JsonResponse
    {
        Shipment::findOrFail($id)->delete();
        return response()->json(['message' => 'Shipment deleted']);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:transit,delivered,pending,delayed,customs']);
        $shipment = Shipment::findOrFail($id);
        $shipment->update(['status' => $request->status]);
        return response()->json($shipment);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array', 'status' => 'required|in:transit,delivered,pending,delayed,customs']);
        Shipment::whereIn('id', $request->ids)->update(['status' => $request->status]);
        return response()->json(['message' => 'Bulk update applied', 'count' => count($request->ids)]);
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
                        $s->awb_number, $s->type, $s->origin, $s->dest,
                        $s->customer, $s->weight, $s->mode, $s->status,
                        $s->eta?->format('Y-m-d'),
                    ]);
                }
            });
            fclose($out);
        }, 'shipments.csv', $headers);
    }
}
