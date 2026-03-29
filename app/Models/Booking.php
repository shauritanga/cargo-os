<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'customer',
        'origin',
        'dest',
        'mode',
        'type',
        'weight',
        'containers',
        'urgency',
        'status',
        'contact',
        'email',
        'phone',
        'message',
        'converted_to',
        'assigned_to',
        'notes',
    ];

    protected $casts = [
        'weight' => 'float',
        'containers' => 'integer',
    ];
}
