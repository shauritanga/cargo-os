<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_no',
        'customer',
        'shipment_ref',
        'currency',
        'amount',
        'status',
        'issued',
        'due',
        'items',
        'notes',
    ];

    protected $casts = [
        'amount' => 'float',
        'issued' => 'date',
        'due' => 'date',
        'items' => 'array',
    ];
}
