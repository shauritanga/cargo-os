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
