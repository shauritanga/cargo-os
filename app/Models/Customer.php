<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'name',
        'contact',
        'email',
        'phone',
        'country',
        'country_code',
        'city_town',
        'street_address',
        'type',
        'status',
        'shipments',
        'revenue',
        'since',
        'notes',
    ];

    protected $casts = [
        'shipments' => 'integer',
        'revenue' => 'decimal:2',
        'since' => 'date',
    ];
}
