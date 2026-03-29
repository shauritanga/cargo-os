<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySettings extends Model
{
    protected $fillable = [
        'name',
        'address',
        'country',
        'currency',
        'date_format',
        'awb_prefix',
        'awb_last_sequence',
    ];

    /**
     * Always use the single row (id = 1).
     */
    public static function instance(): self
    {
        return static::firstOrCreate(['id' => 1]);
    }

    /**
     * Generate the next AWB number atomically.
     * Returns e.g. "025500000001"
     */
    public static function nextAwbNumber(): string
    {
        $settings = static::lockForUpdate()->find(1);
        $next = $settings->awb_last_sequence + 1;
        $settings->awb_last_sequence = $next;
        $settings->save();

        return $settings->awb_prefix . str_pad((string) $next, 8, '0', STR_PAD_LEFT);
    }
}
