<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'name',
        'city',
        'country',
        'type',
        'capacity_sqm',
        'used_sqm',
        'active_loads',
        'manager',
        'status',
        'phone',
        'email',
        'address',
        'notes',
    ];

    protected $casts = [
        'capacity_sqm' => 'integer',
        'used_sqm' => 'integer',
        'active_loads' => 'integer',
    ];
}
