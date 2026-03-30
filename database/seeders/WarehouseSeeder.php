<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        if (Warehouse::query()->exists()) {
            return;
        }

        $rows = [
            [
                'name' => 'Dar Central Hub',
                'city' => 'Dar es Salaam',
                'country' => 'TZ',
                'type' => 'General',
                'capacity_sqm' => 6500,
                'used_sqm' => 4200,
                'active_loads' => 34,
                'manager' => 'A. Mwakalinga',
                'status' => 'operational',
                'phone' => '+255 712 000 111',
                'email' => 'dar.hub@rtexpress.co.tz',
                'address' => 'Nyerere Rd, Industrial Area',
                'notes' => 'Primary distribution facility.',
            ],
            [
                'name' => 'Mwanza Cold Depot',
                'city' => 'Mwanza',
                'country' => 'TZ',
                'type' => 'Cold Storage',
                'capacity_sqm' => 2200,
                'used_sqm' => 1850,
                'active_loads' => 19,
                'manager' => 'J. Nanyaro',
                'status' => 'operational',
                'phone' => '+255 744 888 222',
                'email' => 'mwanza.cold@rtexpress.co.tz',
                'address' => 'Airport Rd, Mwanza',
                'notes' => 'Temperature monitored 24/7.',
            ],
            [
                'name' => 'Arusha Bonded Store',
                'city' => 'Arusha',
                'country' => 'TZ',
                'type' => 'Bonded',
                'capacity_sqm' => 1800,
                'used_sqm' => 700,
                'active_loads' => 8,
                'manager' => 'P. Meena',
                'status' => 'maintenance',
                'phone' => '+255 765 111 333',
                'email' => 'arusha.bonded@rtexpress.co.tz',
                'address' => 'Namanga Rd, Arusha',
                'notes' => 'Maintenance window this week.',
            ],
        ];

        foreach ($rows as $row) {
            Warehouse::create($row);
        }
    }
}
