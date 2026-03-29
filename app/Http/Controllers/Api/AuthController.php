<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'remember' => 'sometimes|boolean',
        ]);

        $credentials = [
            'email' => $validated['email'],
            'password' => $validated['password'],
            'is_active' => true,
        ];

        $remember = (bool) ($validated['remember'] ?? false);

        if (! Auth::guard('web')->attempt($credentials, $remember)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 422);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Authenticated.',
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out.',
        ]);
    }

    private function userPayload($user): array
    {
        $user->load(['roles.permissions', 'directPermissions']);

        $effectivePermissions = $user
            ->permissions()
            ->pluck('key')
            ->values()
            ->all();

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
            'effective_permissions' => $effectivePermissions,
        ];
    }
}
