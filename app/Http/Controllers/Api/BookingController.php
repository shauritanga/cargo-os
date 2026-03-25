<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Connect to database model']);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer'   => 'required|string',
            'origin'     => 'required|string',
            'dest'       => 'required|string',
            'mode'       => 'required|in:Sea,Air,Road,Rail',
            'type'       => 'required|string',
            'weight'     => 'required|numeric|min:1',
            'containers' => 'required|integer|min:1',
            'urgency'    => 'required|in:high,medium,low',
        ]);
        return response()->json(['message' => 'Booking created', 'data' => $validated], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['message' => 'Booking ' . $id]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Updated booking ' . $id]);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Deleted booking ' . $id]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:new,reviewing,approved,converted,rejected']);
        return response()->json(['message' => 'Booking ' . $id . ' status updated']);
    }

    public function convert(Request $request, string $id): JsonResponse
    {
        // Convert booking to shipment
        return response()->json(['message' => 'Booking ' . $id . ' converted to shipment']);
    }
}
