<?php

namespace Database\Seeders;

use App\Models\ShippingRoute;
use Illuminate\Database\Seeder;

class ShippingRouteSeeder extends Seeder
{
    public function run(): void
    {
        if (ShippingRoute::query()->exists()) {
            return;
        }

        $rows = [
            [
                'origin' => 'Dar es Salaam',
                'origin_c' => 'TZ',
                'dest' => 'Nairobi',
                'dest_c' => 'KE',
                'mode' => 'Road',
                'type' => 'international',
                'status' => 'active',
                'avg_days' => 2,
                'shipments' => 18,
                'freq' => 'Daily',
                'carrier' => 'RT Ground',
            ],
            [
                'origin' => 'Dar es Salaam',
                'origin_c' => 'TZ',
                'dest' => 'Dubai',
                'dest_c' => 'AE',
                'mode' => 'Sea',
                'type' => 'international',
                'status' => 'active',
                'avg_days' => 12,
                'shipments' => 9,
                'freq' => 'Weekly',
                'carrier' => 'Maersk',
            ],
            [
                'origin' => 'Nairobi',
                'origin_c' => 'KE',
                'dest' => 'Johannesburg',
                'dest_c' => 'ZA',
                'mode' => 'Air',
                'type' => 'international',
                'status' => 'active',
                'avg_days' => 1,
                'shipments' => 14,
                'freq' => 'Bi-Weekly',
                'carrier' => 'Kenya Airways Cargo',
            ],
            [
                'origin' => 'Mwanza',
                'origin_c' => 'TZ',
                'dest' => 'Dodoma',
                'dest_c' => 'TZ',
                'mode' => 'Road',
                'type' => 'domestic',
                'status' => 'inactive',
                'avg_days' => 1,
                'shipments' => 0,
                'freq' => 'Weekly',
                'carrier' => 'RT Ground',
            ],
        ];

        foreach ($rows as $row) {
            ShippingRoute::create($row);
        }
    }
}
