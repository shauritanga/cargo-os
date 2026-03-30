<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FleetVehicle;
use App\Models\ShippingRoute;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FleetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FleetVehicle::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', (string) $request->string('type'));
        }

        if ($request->filled('search')) {
            $q = (string) $request->string('search');
            $query->where(function ($builder) use ($q) {
                $builder->whereRaw('CAST(id AS TEXT) LIKE ?', ["%{$q}%"])
                    ->orWhere('make', 'ilike', "%{$q}%")
                    ->orWhere('plate', 'ilike', "%{$q}%")
                    ->orWhere('driver', 'ilike', "%{$q}%")
                    ->orWhere('base', 'ilike', "%{$q}%")
                    ->orWhere('current_route', 'ilike', "%{$q}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:Truck,Ship,Aircraft,Rail',
            'make' => 'required|string|max:255',
            'plate' => 'required|string|max:255',
            'driver' => 'nullable|string|max:255',
            'capacity_tons' => 'nullable|numeric|min:0',
            'route_id' => 'nullable|integer|exists:shipping_routes,id',
            'current_route' => 'nullable|string|max:255',
            'last_service' => 'nullable|date',
            'next_service' => 'nullable|date',
            'mileage' => 'nullable|integer|min:0',
            'fuel_type' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:1900|max:2100',
            'status' => 'nullable|in:active,idle,maintenance,retired',
            'notes' => 'nullable|string|max:3000',
            'base' => 'nullable|string|max:255',
        ]);

        $validated = $this->resolveRouteLink($validated);

        $vehicle = FleetVehicle::create(array_merge([
            'status' => 'idle',
        ], $validated));

        return response()->json($vehicle, 201);
    }

    public function show(FleetVehicle $vehicle): JsonResponse
    {
        return response()->json($vehicle);
    }

    public function update(Request $request, FleetVehicle $vehicle): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|required|in:Truck,Ship,Aircraft,Rail',
            'make' => 'sometimes|required|string|max:255',
            'plate' => 'sometimes|required|string|max:255',
            'driver' => 'sometimes|nullable|string|max:255',
            'capacity_tons' => 'sometimes|nullable|numeric|min:0',
            'route_id' => 'sometimes|nullable|integer|exists:shipping_routes,id',
            'current_route' => 'sometimes|nullable|string|max:255',
            'last_service' => 'sometimes|nullable|date',
            'next_service' => 'sometimes|nullable|date',
            'mileage' => 'sometimes|nullable|integer|min:0',
            'fuel_type' => 'sometimes|nullable|string|max:100',
            'year' => 'sometimes|nullable|integer|min:1900|max:2100',
            'status' => 'sometimes|required|in:active,idle,maintenance,retired',
            'notes' => 'sometimes|nullable|string|max:3000',
            'base' => 'sometimes|nullable|string|max:255',
        ]);

        $validated = $this->resolveRouteLink($validated);

        $vehicle->update($validated);

        return response()->json($vehicle->fresh());
    }

    public function destroy(FleetVehicle $vehicle): JsonResponse
    {
        $vehicle->delete();

        return response()->json(['message' => 'Vehicle deleted']);
    }

    public function updateStatus(Request $request, FleetVehicle $vehicle): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:active,idle,maintenance,retired',
        ]);

        $vehicle->update(['status' => $validated['status']]);

        return response()->json($vehicle->fresh());
    }

    /**
     * Keep route_id and current_route text in sync for compatibility with existing UI payloads.
     */
    private function resolveRouteLink(array $attributes): array
    {
        if (array_key_exists('route_id', $attributes)) {
            $routeId = $attributes['route_id'];
            if (empty($routeId)) {
                $attributes['route_id'] = null;
                $attributes['current_route'] = null;
                return $attributes;
            }

            $route = ShippingRoute::find((int) $routeId);
            if ($route) {
                $attributes['route_id'] = $route->id;
                $attributes['current_route'] = trim($route->origin) . ' -> ' . trim($route->dest);
            }

            return $attributes;
        }

        if (array_key_exists('current_route', $attributes)) {
            $label = trim((string) ($attributes['current_route'] ?? ''));
            if ($label === '') {
                $attributes['current_route'] = null;
                $attributes['route_id'] = null;
                return $attributes;
            }

            $parts = preg_split('/\s*->\s*/', $label);
            if (is_array($parts) && count($parts) === 2) {
                $origin = trim((string) $parts[0]);
                $dest = trim((string) $parts[1]);

                $route = ShippingRoute::query()
                    ->where('origin', $origin)
                    ->where('dest', $dest)
                    ->first();

                $attributes['route_id'] = $route?->id;
            } else {
                $attributes['route_id'] = null;
            }
        }

        return $attributes;
    }
}
