<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingRoute extends Model
{
    use BelongsToBranch;

    protected $table = 'shipping_routes';

    protected $fillable = [
        'branch_id',
        'origin',
        'origin_c',
        'dest',
        'dest_c',
        'mode',
        'type',
        'status',
        'avg_days',
        'shipments',
        'freq',
        'carrier',
    ];

    protected $casts = [
        'avg_days' => 'integer',
        'shipments' => 'integer',
    ];

    public function fleetVehicles(): HasMany
    {
        return $this->hasMany(FleetVehicle::class, 'route_id');
    }
}
