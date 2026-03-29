<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->query('per_page', 50), 200));

        $users = User::query()
            ->with(['roles', 'directPermissions'])
            ->orderBy('name')
            ->paginate($perPage);

        $users->through(fn(User $user) => $this->serializeUser($user));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'is_active' => 'sometimes|boolean',
        ]);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return response()->json($this->serializeUser($user->fresh(['roles', 'directPermissions'])), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8',
            'is_active' => 'sometimes|boolean',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        if (array_key_exists('is_active', $validated) && ! $validated['is_active']) {
            $this->ensureNotLastActiveAdmin($user);
        }

        if (array_key_exists('is_active', $validated)) {
            $user->is_active = (bool) $validated['is_active'];
        }

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json($this->serializeUser($user->fresh(['roles', 'directPermissions'])));
    }

    public function assignRoles(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'integer|exists:roles,id',
        ]);

        $roleIds = Role::query()->whereIn('id', $validated['role_ids'])->pluck('id')->all();

        $adminRole = Role::query()->where('name', 'admin')->first();

        if ($adminRole !== null) {
            $wouldLoseAdmin = $user->roles()->where('roles.id', $adminRole->id)->exists()
                && ! in_array($adminRole->id, $roleIds, true);

            if ($wouldLoseAdmin) {
                $this->ensureNotLastActiveAdmin($user);
            }
        }

        $user->roles()->sync($roleIds);

        return response()->json($this->serializeUser($user->fresh(['roles', 'directPermissions'])));
    }

    public function assignDirectPermissions(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $permissionIds = Permission::query()
            ->whereIn('id', $validated['permission_ids'])
            ->pluck('id')
            ->all();

        $user->directPermissions()->sync($permissionIds);

        return response()->json($this->serializeUser($user->fresh(['roles', 'directPermissions'])));
    }

    private function ensureNotLastActiveAdmin(User $targetUser): void
    {
        $adminRole = Role::query()->where('name', 'admin')->first();

        if ($adminRole === null) {
            return;
        }

        $isAdmin = $targetUser->roles()->where('roles.id', $adminRole->id)->exists();

        if (! $isAdmin) {
            return;
        }

        $otherActiveAdmins = User::query()
            ->where('users.id', '!=', $targetUser->id)
            ->where('users.is_active', true)
            ->whereHas('roles', fn($q) => $q->where('roles.id', $adminRole->id))
            ->count();

        if ($otherActiveAdmins === 0) {
            throw ValidationException::withMessages([
                'user' => ['At least one active admin user must remain.'],
            ]);
        }
    }

    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => $user->is_active,
            'roles' => $user->roles->map(fn($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
            ])->values()->all(),
            'direct_permissions' => $user->directPermissions->map(fn($permission) => [
                'id' => $permission->id,
                'key' => $permission->key,
                'resource' => $permission->resource,
                'action' => $permission->action,
                'description' => $permission->description,
            ])->values()->all(),
            'effective_permissions' => $user->permissions()->pluck('key')->values()->all(),
        ];
    }
}
