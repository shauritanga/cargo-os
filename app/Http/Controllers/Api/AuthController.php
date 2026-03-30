<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private const LOGIN_MAX_ATTEMPTS = 5;
    private const LOGIN_DECAY_SECONDS = 60;

    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'remember' => 'sometimes|boolean',
        ]);

        $throttleKey = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($throttleKey, self::LOGIN_MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            $this->auditLogService->recordAuthEvent(
                request: $request,
                action: 'auth.login.locked',
                statusCode: 429,
                metadata: ['available_in_seconds' => $seconds]
            );

            return response()->json([
                'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        $credentials = [
            'email' => $validated['email'],
            'password' => $validated['password'],
            'is_active' => true,
        ];

        $remember = (bool) ($validated['remember'] ?? false);

        if (! Auth::guard('web')->attempt($credentials, $remember)) {
            RateLimiter::hit($throttleKey, self::LOGIN_DECAY_SECONDS);

            $this->auditLogService->recordAuthEvent(
                request: $request,
                action: 'auth.login.failed',
                statusCode: 422
            );

            return response()->json([
                'message' => 'Invalid credentials.',
            ], 422);
        }

        RateLimiter::clear($throttleKey);

        $request->session()->regenerate();

        $this->auditLogService->recordAuthEvent(
            request: $request,
            action: 'auth.login.success',
            statusCode: 200,
            userId: $request->user()?->id
        );

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
        $this->auditLogService->recordAuthEvent(
            request: $request,
            action: 'auth.logout',
            statusCode: 200,
            userId: $request->user()?->id
        );

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

    private function throttleKey(Request $request): string
    {
        return Str::lower((string) $request->input('email')) . '|' . $request->ip();
    }
}
