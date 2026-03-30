<?php

namespace App\Http\Middleware;

use App\Services\AuditLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuditApiActivity
{
    /**
     * @var array<int, string>
     */
    private array $excludedPaths = [
        'api/audit-logs',
        'api/audit-logs/*',
        'api/logout',
    ];

    /**
     * @var array<int, string>
     */
    private array $nonAuditedMethods = [
        'GET',
        'HEAD',
        'OPTIONS',
    ];

    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldSkip($request)) {
            return $next($request);
        }

        try {
            $response = $next($request);
            $this->auditLogService->recordRequest($request, $response->getStatusCode());

            return $response;
        } catch (Throwable $exception) {
            $this->auditLogService->recordRequest($request, 500, [
                'exception' => class_basename($exception),
            ]);

            throw $exception;
        }
    }

    private function shouldSkip(Request $request): bool
    {
        if (in_array(strtoupper($request->method()), $this->nonAuditedMethods, true)) {
            return true;
        }

        foreach ($this->excludedPaths as $pathPattern) {
            if ($request->is($pathPattern)) {
                return true;
            }
        }

        return false;
    }
}
