<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShipmentStatusEvent extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'shipment_id',
        'previous_status',
        'new_status',
        'reason',
        'is_override',
        'override_reason',
        'metadata',
        'triggered_by',
        'occurred_at',
    ];

    protected $casts = [
        'is_override' => 'boolean',
        'metadata' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }
}
