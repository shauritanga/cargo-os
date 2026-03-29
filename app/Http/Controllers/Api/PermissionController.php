<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->query('per_page', 200), 500));

        $permissions = Permission::query()
            ->orderBy('resource')
            ->orderBy('action')
            ->paginate($perPage);

        return response()->json($permissions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resource' => 'required|string|max:100|alpha_dash',
            'action' => 'required|string|max:100|alpha_dash',
            'description' => 'nullable|string|max:255',
        ]);

        $key = $validated['resource'] . '.' . $validated['action'];

        $permission = Permission::query()->create([
            'key' => $key,
            'resource' => $validated['resource'],
            'action' => $validated['action'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json($permission, 201);
    }

    public function update(Request $request, Permission $permission): JsonResponse
    {
        $validated = $request->validate([
            'resource' => 'required|string|max:100|alpha_dash',
            'action' => 'required|string|max:100|alpha_dash',
            'description' => 'nullable|string|max:255',
        ]);

        $permission->update([
            'key' => $validated['resource'] . '.' . $validated['action'],
            'resource' => $validated['resource'],
            'action' => $validated['action'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json($permission);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $permission->delete();

        return response()->json([
            'message' => 'Permission deleted.',
        ]);
    }
}
