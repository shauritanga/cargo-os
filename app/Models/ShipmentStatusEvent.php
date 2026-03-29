<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShipmentStatusEvent extends Model
{
    protected $fillable = [
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
