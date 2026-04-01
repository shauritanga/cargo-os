<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Throwable;

class AuditLogService
{
    /**
     * @var array<int, string>
     */
    private array $sensitiveKeys = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'remember_token',
        'authorization',
        'secret',
    ];

    public function recordRequest(Request $request, int $statusCode, array $metadata = []): void
    {
        $payload = $request->isMethod('GET')
            ? $request->query()
            : $request->all();

        $this->persist(
            request: $request,
            action: $this->resolveAction($request),
            statusCode: $statusCode,
            requestData: $this->sanitizeValue($payload),
            metadata: $this->sanitizeValue($metadata),
            userId: $request->user()?->id
        );
    }

    public function recordAuthEvent(
        Request $request,
        string $action,
        int $statusCode,
        ?int $userId = null,
        array $metadata = []
    ): void {
        $payload = Arr::only($request->all(), ['email', 'remember']);

        $this->persist(
            request: $request,
            action: $action,
            statusCode: $statusCode,
            requestData: $this->sanitizeValue($payload),
            metadata: $this->sanitizeValue($metadata),
            userId: $userId
        );
    }

    private function persist(
        Request $request,
        string $action,
        int $statusCode,
        mixed $requestData,
        mixed $metadata,
        ?int $userId
    ): void {
        try {
            $branchId = $request->user()?->branch_id;

            if ($branchId === null && ($request->route('branch')?->id ?? null) !== null) {
                $branchId = (int) $request->route('branch')->id;
            }

            AuditLog::query()->create([
                'branch_id' => $branchId,
                'user_id' => $userId,
                'action' => Str::limit($action, 150, ''),
                'http_method' => Str::upper($request->method()),
                'path' => '/' . ltrim($request->path(), '/'),
                'status_code' => $statusCode,
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 1500),
                'request_data' => $this->emptyToNull($requestData),
                'metadata' => $this->emptyToNull($metadata),
            ]);
        } catch (Throwable) {
            // Avoid interrupting the main request flow when logging fails.
        }
    }

    private function resolveAction(Request $request): string
    {
        $route = $request->route();
        $action = $route?->getActionName();

        if (is_string($action) && str_contains($action, '@')) {
            [$class, $method] = explode('@', $action, 2);
            $controller = class_basename($class);
            $controller = Str::of($controller)->replace('Controller', '')->snake()->value();

            return "api.{$controller}.{$method}";
        }

        return 'api.unknown';
    }

    private function emptyToNull(mixed $value): mixed
    {
        if (is_array($value) && $value === []) {
            return null;
        }

        return $value;
    }

    private function sanitizeValue(mixed $value): mixed
    {
        if (is_array($value)) {
            $result = [];
            foreach ($value as $key => $item) {
                $normalizedKey = Str::lower((string) $key);

                if (in_array($normalizedKey, $this->sensitiveKeys, true)) {
                    $result[$key] = '[REDACTED]';
                    continue;
                }

                $result[$key] = $this->sanitizeValue($item);
            }

            return $result;
        }

        if (is_string($value)) {
            return Str::limit($value, 500);
        }

        if (is_bool($value) || is_numeric($value) || $value === null) {
            return $value;
        }

        return Str::limit((string) json_encode($value), 500);
    }
}
