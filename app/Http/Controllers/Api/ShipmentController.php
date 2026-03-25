<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ShipmentController extends Controller
{
    /**
     * Display a listing of shipments.
     * Connect to Shipment model when database is set up.
     */
    public function index(Request $request): JsonResponse
    {
        // TODO: return Shipment::filter($request)->paginate(10);
        return response()->json(['message' => 'Connect to database model']);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'         => 'required|in:international,domestic',
            'origin'       => 'required|string',
            'dest'         => 'required|string',
            'customer'     => 'required|string',
            'weight'       => 'required|numeric|min:1',
            'mode'         => 'required|in:Sea,Air,Road,Rail',
            'cargoType'    => 'required|string',
            'status'       => 'required|in:transit,delivered,pending,delayed,customs',
            'eta'          => 'required|date',
        ]);
        // TODO: return Shipment::create($validated);
        return response()->json(['message' => 'Shipment would be created', 'data' => $validated], 201);
    }

    public function show(string $id): JsonResponse
    {
        // TODO: return Shipment::findOrFail($id);
        return response()->json(['message' => 'Shipment ' . $id]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        // TODO: Shipment::findOrFail($id)->update($request->validated());
        return response()->json(['message' => 'Updated shipment ' . $id]);
    }

    public function destroy(string $id): JsonResponse
    {
        // TODO: Shipment::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted shipment ' . $id]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:transit,delivered,pending,delayed,customs']);
        return response()->json(['message' => 'Status updated for ' . $id]);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array', 'status' => 'required|string']);
        return response()->json(['message' => 'Bulk update applied']);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array']);
        return response()->json(['message' => 'Bulk delete applied']);
    }

    public function exportCsv(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = ['Content-Type' => 'text/csv', 'Content-Disposition' => 'attachment; filename="shipments.csv"'];
        return response()->streamDownload(function () {
            echo "ID,Origin,Destination,Customer,Weight,Mode,Status\n";
            // TODO: stream real data
        }, 'shipments.csv', $headers);
    }
}
