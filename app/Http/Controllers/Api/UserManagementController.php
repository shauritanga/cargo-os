<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->query('per_page', 50), 200));
        $validated = $request->validate([
            'branch_id' => 'sometimes|integer|exists:branches,id',
        ]);

        $users = User::query()
            ->with(['roles', 'directPermissions', 'branch'])
            ->when(
                array_key_exists('branch_id', $validated),
                fn($q) => $q->where('branch_id', (int) $validated['branch_id'])
            )
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
            'password' => [
                'required',
                'string',
                Password::min(12)->mixedCase()->letters()->numbers()->symbols()->uncompromised(),
            ],
            'is_active' => 'sometimes|boolean',
            'branch_id' => 'sometimes|integer|exists:branches,id',
        ]);

        $branchId = array_key_exists('branch_id', $validated)
            ? (int) $validated['branch_id']
            : Branch::resolveDefaultId();
        $this->ensureBranchIsActive($branchId);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'branch_id' => $branchId,
        ]);

        return response()->json($this->serializeUser($user->fresh(['roles', 'directPermissions', 'branch'])), 201);
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
            'password' => [
                'nullable',
                'string',
                Password::min(12)->mixedCase()->letters()->numbers()->symbols()->uncompromised(),
            ],
            'is_active' => 'sometimes|boolean',
            'branch_id' => 'sometimes|integer|exists:branches,id',
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

        if (array_key_exists('branch_id', $validated)) {
            $branchId = (int) $validated['branch_id'];
            $this->ensureBranchIsActive($branchId);
            $user->branch_id = $branchId;
        }

        $user->save();

        return response()->json($this->serializeUser($user->fresh(['roles', 'directPermissions', 'branch'])));
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

        return response()->json($this->serializeUser($user->fresh(['roles', 'directPermissions', 'branch'])));
    }

    public function assignBranch(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
        ]);

        $branchId = (int) $validated['branch_id'];
        $this->ensureBranchIsActive($branchId);
        $user->branch_id = $branchId;
        $user->save();

        return response()->json($this->serializeUser($user->fresh(['roles', 'directPermissions', 'branch'])));
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

        return response()->json($this->serializeUser($user->fresh(['roles', 'directPermissions', 'branch'])));
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
            'branch' => $user->branch ? [
                'id' => $user->branch->id,
                'name' => $user->branch->name,
                'code' => $user->branch->code,
                'is_active' => $user->branch->is_active,
            ] : null,
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

    private function ensureBranchIsActive(int $branchId): void
    {
        $branch = Branch::query()->findOrFail($branchId);

        if (! $branch->is_active) {
            throw ValidationException::withMessages([
                'branch_id' => ['User can only be assigned to an active branch.'],
            ]);
        }
    }
}
