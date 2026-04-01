<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
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
