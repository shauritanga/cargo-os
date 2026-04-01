<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'user_id',
        'action',
        'http_method',
        'path',
        'status_code',
        'ip_address',
        'user_agent',
        'request_data',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'request_data' => 'array',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
