<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WarehouseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Connect to database model']);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Warehouse created'], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['message' => 'Warehouse ' . $id]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Updated warehouse ' . $id]);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Deleted warehouse ' . $id]);
    }
}
