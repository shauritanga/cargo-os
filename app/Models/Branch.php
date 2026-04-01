<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    public const DEFAULT_CODE = 'MAIN';

    protected $fillable = [
        'name',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public static function resolveDefaultId(): int
    {
        $branch = self::query()->firstOrCreate(
            ['code' => self::DEFAULT_CODE],
            ['name' => 'Main Branch', 'is_active' => true],
        );

        return (int) $branch->id;
    }
}

