<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WarehouseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::query()->orderByDesc('created_at');

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
                    ->orWhere('name', 'ilike', "%{$q}%")
                    ->orWhere('city', 'ilike', "%{$q}%")
                    ->orWhere('country', 'ilike', "%{$q}%")
                    ->orWhere('manager', 'ilike', "%{$q}%")
                    ->orWhere('address', 'ilike', "%{$q}%");
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'country' => 'nullable|string|max:10',
            'type' => 'nullable|in:General,Cold Storage,Hazardous,Bonded',
            'capacity_sqm' => 'nullable|integer|min:0',
            'used_sqm' => 'nullable|integer|min:0',
            'active_loads' => 'nullable|integer|min:0',
            'manager' => 'nullable|string|max:255',
            'status' => 'nullable|in:operational,maintenance,closed',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:3000',
        ]);

        $warehouse = Warehouse::create(array_merge([
            'country' => 'TZ',
            'type' => 'General',
            'capacity_sqm' => 0,
            'used_sqm' => 0,
            'active_loads' => 0,
            'status' => 'operational',
        ], $validated));

        return response()->json($warehouse, 201);
    }

    public function show(Warehouse $warehouse): JsonResponse
    {
        return response()->json($warehouse);
    }

    public function update(Request $request, Warehouse $warehouse): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'city' => 'sometimes|required|string|max:255',
            'country' => 'sometimes|nullable|string|max:10',
            'type' => 'sometimes|required|in:General,Cold Storage,Hazardous,Bonded',
            'capacity_sqm' => 'sometimes|nullable|integer|min:0',
            'used_sqm' => 'sometimes|nullable|integer|min:0',
            'active_loads' => 'sometimes|nullable|integer|min:0',
            'manager' => 'sometimes|nullable|string|max:255',
            'status' => 'sometimes|required|in:operational,maintenance,closed',
            'phone' => 'sometimes|nullable|string|max:50',
            'email' => 'sometimes|nullable|email|max:255',
            'address' => 'sometimes|nullable|string|max:255',
            'notes' => 'sometimes|nullable|string|max:3000',
        ]);

        $warehouse->update($validated);

        return response()->json($warehouse->fresh());
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        if ((int) $warehouse->active_loads > 0) {
            return response()->json([
                'message' => 'Cannot delete warehouse while it has active loads. Move or close all active loads first.',
            ], 422);
        }

        $warehouse->delete();

        return response()->json(['message' => 'Warehouse deleted']);
    }
}
