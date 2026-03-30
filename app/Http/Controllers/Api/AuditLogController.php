<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = 10;

        $query = AuditLog::query()
            ->with('user:id,name,email')
            ->orderByDesc('created_at');

        if ($request->filled('method')) {
            $query->where('http_method', strtoupper((string) $request->query('method')));
        }

        if ($request->filled('status_code')) {
            $query->where('status_code', (int) $request->query('status_code'));
        }

        if ($request->filled('q')) {
            $search = (string) $request->query('q');
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('action', 'like', "%{$search}%")
                    ->orWhere('path', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', (string) $request->query('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', (string) $request->query('to'));
        }

        $logs = $query->paginate($perPage);

        $logs->through(fn(AuditLog $log) => [
            'id' => $log->id,
            'action' => $log->action,
            'http_method' => $log->http_method,
            'path' => $log->path,
            'status_code' => $log->status_code,
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'request_data' => $log->request_data,
            'metadata' => $log->metadata,
            'created_at' => $log->created_at?->toIso8601String(),
            'user' => $log->user ? [
                'id' => $log->user->id,
                'name' => $log->user->name,
                'email' => $log->user->email,
            ] : null,
        ]);

        return response()->json($logs);
    }
}
