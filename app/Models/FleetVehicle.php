<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FleetVehicle extends Model
{
    protected $table = 'fleet_vehicles';

    protected $fillable = [
        'type',
        'make',
        'plate',
        'driver',
        'capacity_tons',
        'route_id',
        'current_route',
        'last_service',
        'next_service',
        'mileage',
        'fuel_type',
        'year',
        'status',
        'notes',
        'base',
    ];

    protected $casts = [
        'capacity_tons' => 'float',
        'last_service' => 'date',
        'next_service' => 'date',
        'mileage' => 'integer',
        'year' => 'integer',
    ];

    public function route(): BelongsTo
    {
        return $this->belongsTo(ShippingRoute::class, 'route_id');
    }
}
