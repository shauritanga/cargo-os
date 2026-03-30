<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FleetVehicle;
use App\Models\ShippingRoute;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class RouteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ShippingRoute::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        if ($request->filled('mode')) {
            $query->where('mode', (string) $request->string('mode'));
        }

        if ($request->filled('type')) {
            $query->where('type', (string) $request->string('type'));
        }

        if ($request->filled('search')) {
            $q = (string) $request->string('search');
            $query->where(function ($builder) use ($q) {
                $builder->whereRaw('CAST(id AS TEXT) LIKE ?', ["%{$q}%"])
                    ->orWhere('origin', 'like', "%{$q}%")
                    ->orWhere('origin_c', 'like', "%{$q}%")
                    ->orWhere('dest', 'like', "%{$q}%")
                    ->orWhere('dest_c', 'like', "%{$q}%")
                    ->orWhere('carrier', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'origin' => 'required|string|max:255',
            'origin_c' => 'nullable|string|max:10',
            'dest' => 'required|string|max:255',
            'dest_c' => 'nullable|string|max:10',
            'mode' => 'required|in:Sea,Air,Road,Rail',
            'type' => 'required|in:international,domestic',
            'status' => 'nullable|in:active,inactive',
            'avg_days' => 'nullable|integer|min:0|max:365',
            'shipments' => 'nullable|integer|min:0',
            'freq' => 'nullable|string|max:100',
            'carrier' => 'nullable|string|max:255',
        ]);

        $route = ShippingRoute::create(array_merge([
            'status' => 'active',
            'avg_days' => 0,
            'shipments' => 0,
            'freq' => 'Weekly',
        ], $validated));

        return response()->json($route, 201);
    }

    public function show(ShippingRoute $route): JsonResponse
    {
        return response()->json($route);
    }

    public function update(Request $request, ShippingRoute $route): JsonResponse
    {
        $validated = $request->validate([
            'origin' => 'sometimes|required|string|max:255',
            'origin_c' => 'sometimes|nullable|string|max:10',
            'dest' => 'sometimes|required|string|max:255',
            'dest_c' => 'sometimes|nullable|string|max:10',
            'mode' => 'sometimes|required|in:Sea,Air,Road,Rail',
            'type' => 'sometimes|required|in:international,domestic',
            'status' => 'sometimes|required|in:active,inactive',
            'avg_days' => 'sometimes|nullable|integer|min:0|max:365',
            'shipments' => 'sometimes|nullable|integer|min:0',
            'freq' => 'sometimes|nullable|string|max:100',
            'carrier' => 'sometimes|nullable|string|max:255',
        ]);

        if (($validated['status'] ?? null) === 'inactive' && $this->hasActiveFleetAssignment($route)) {
            throw ValidationException::withMessages([
                'status' => 'Cannot set this route inactive while active fleet is assigned to it.',
            ]);
        }

        $route->update($validated);

        return response()->json($route->fresh());
    }

    public function destroy(ShippingRoute $route): JsonResponse
    {
        $route->delete();

        return response()->json(['message' => 'Route deleted']);
    }

    public function updateStatus(Request $request, ShippingRoute $route): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        if ($validated['status'] === 'inactive' && $this->hasActiveFleetAssignment($route)) {
            throw ValidationException::withMessages([
                'status' => 'Cannot set this route inactive while active fleet is assigned to it.',
            ]);
        }

        $route->update(['status' => $validated['status']]);

        return response()->json($route->fresh());
    }

    private function hasActiveFleetAssignment(ShippingRoute $route): bool
    {
        return FleetVehicle::query()
            ->where('route_id', $route->id)
            ->where('status', 'active')
            ->exists();
    }
}
