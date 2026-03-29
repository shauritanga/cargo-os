<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->query('per_page', 50), 200));

        $roles = Role::query()
            ->with('permissions')
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json($roles);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|alpha_dash|unique:roles,name',
            'description' => 'nullable|string|max:255',
        ]);

        $role = Role::query()->create($validated);

        return response()->json($role->load('permissions'), 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|alpha_dash|unique:roles,name,' . $role->id,
            'description' => 'nullable|string|max:255',
        ]);

        if ($role->name === 'admin' && $validated['name'] !== 'admin') {
            return response()->json([
                'message' => 'Admin role name cannot be changed.',
            ], 422);
        }

        $role->update($validated);

        return response()->json($role->load('permissions'));
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->name === 'admin') {
            return response()->json([
                'message' => 'Admin role cannot be deleted.',
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted.',
        ]);
    }

    public function assignPermissions(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $permissionIds = Permission::query()
            ->whereIn('id', $validated['permission_ids'])
            ->pluck('id')
            ->all();

        $role->permissions()->sync($permissionIds);

        return response()->json($role->load('permissions'));
    }
}
