<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CountriesSeeder::class,
            RolePermissionSeeder::class,
            AdminUserSeeder::class,
            FleetVehicleSeeder::class,
            ShippingRouteSeeder::class,
            WarehouseSeeder::class,
            CustomerSeeder::class,
            BillingInvoiceSeeder::class,
        ]);
    }
}
