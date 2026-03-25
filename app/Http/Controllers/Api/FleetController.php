<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FleetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Connect to database model']);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Vehicle created'], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['message' => 'Vehicle ' . $id]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Updated vehicle ' . $id]);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Deleted vehicle ' . $id]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:active,idle,maintenance,retired']);
        return response()->json(['message' => 'Vehicle ' . $id . ' status updated']);
    }
}
