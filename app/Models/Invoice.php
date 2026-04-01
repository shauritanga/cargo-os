<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
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
