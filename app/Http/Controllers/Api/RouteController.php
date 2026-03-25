<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RouteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Connect to database model']);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Route created'], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['message' => 'Route ' . $id]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Updated route ' . $id]);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Deleted route ' . $id]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:active,inactive']);
        return response()->json(['message' => 'Route ' . $id . ' status updated']);
    }
}
