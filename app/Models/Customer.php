<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
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
