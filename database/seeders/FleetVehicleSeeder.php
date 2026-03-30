<?php

namespace Database\Seeders;

use App\Models\FleetVehicle;
use Illuminate\Database\Seeder;

class FleetVehicleSeeder extends Seeder
{
    public function run(): void
    {
        if (FleetVehicle::query()->exists()) {
            return;
        }

        $rows = [
            [
                'type' => 'Truck',
                'make' => 'Volvo FH 500',
                'plate' => 'T 201 BCD',
                'driver' => 'M. Juma',
                'capacity_tons' => 20,
                'current_route' => 'DAR -> NBI',
                'last_service' => now()->subDays(30)->toDateString(),
                'next_service' => now()->addDays(60)->toDateString(),
                'mileage' => 145000,
                'fuel_type' => 'Diesel',
                'year' => 2021,
                'status' => 'active',
                'base' => 'Dar es Salaam',
            ],
            [
                'type' => 'Ship',
                'make' => 'MV Coastal Star',
                'plate' => 'IMO9843210',
                'driver' => 'A. Mussa',
                'capacity_tons' => 1200,
                'current_route' => 'DAR -> DXB',
                'last_service' => now()->subDays(90)->toDateString(),
                'next_service' => now()->addDays(90)->toDateString(),
                'mileage' => 92000,
                'fuel_type' => 'Bunker Fuel',
                'year' => 2017,
                'status' => 'active',
                'base' => 'Dar es Salaam Port',
            ],
            [
                'type' => 'Aircraft',
                'make' => 'Boeing 737F',
                'plate' => '5H-RTA',
                'driver' => 'K. Nyerere',
                'capacity_tons' => 24,
                'current_route' => 'NBO -> DXB',
                'last_service' => now()->subDays(20)->toDateString(),
                'next_service' => now()->addDays(40)->toDateString(),
                'mileage' => 38000,
                'fuel_type' => 'Jet A-1',
                'year' => 2019,
                'status' => 'idle',
                'base' => 'Nairobi',
            ],
            [
                'type' => 'Rail',
                'make' => 'GE Evolution',
                'plate' => 'SGR-771',
                'driver' => 'J. Mwita',
                'capacity_tons' => 480,
                'current_route' => 'DSM -> MWZ',
                'last_service' => now()->subDays(45)->toDateString(),
                'next_service' => now()->addDays(45)->toDateString(),
                'mileage' => 210000,
                'fuel_type' => 'Diesel/Electric',
                'year' => 2015,
                'status' => 'maintenance',
                'base' => 'Dar es Salaam',
            ],
        ];

        foreach ($rows as $row) {
            FleetVehicle::create($row);
        }
    }
}
