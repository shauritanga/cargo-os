<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    protected $fillable = [
        'awb_number', 'type', 'origin', 'origin_country', 'dest', 'dest_country',
        'customer', 'weight', 'mode', 'cargo_type', 'status', 'eta',
        'contact', 'email', 'phone', 'notes', 'declared_value', 'insurance',
        'pieces', 'contents', 'consignor', 'consignee',
    ];

    protected $casts = [
        'consignor' => 'array',
        'consignee' => 'array',
        'eta'       => 'date',
        'weight'    => 'float',
        'pieces'    => 'integer',
    ];
}
