<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        if (Customer::query()->exists()) {
            return;
        }

        $rows = [
            [
                'name' => 'Unilever Ltd',
                'contact' => 'James Omondi',
                'email' => 'james@unilever.com',
                'phone' => '+254 700 123 456',
                'country' => 'Kenya',
                'type' => 'Enterprise',
                'status' => 'active',
                'shipments' => 84,
                'revenue' => 142500,
                'since' => '2021-03-15',
                'notes' => 'Strategic enterprise account.',
            ],
            [
                'name' => 'DHL Express',
                'contact' => 'Sarah Kimani',
                'email' => 'sarah@dhl.com',
                'phone' => '+254 722 987 654',
                'country' => 'Kenya',
                'type' => 'Enterprise',
                'status' => 'active',
                'shipments' => 212,
                'revenue' => 389200,
                'since' => '2020-07-01',
                'notes' => null,
            ],
            [
                'name' => 'Jumia Kenya',
                'contact' => 'Amina Abdalla',
                'email' => 'amina@jumia.co.ke',
                'phone' => '+254 711 200 300',
                'country' => 'Kenya',
                'type' => 'SME',
                'status' => 'inactive',
                'shipments' => 0,
                'revenue' => 19800,
                'since' => '2023-05-22',
                'notes' => 'Paused account pending renewal.',
            ],
            [
                'name' => 'Ali Logistics',
                'contact' => 'Ali Hassan',
                'email' => 'ali@alilogistics.co.tz',
                'phone' => '+255 754 100 200',
                'country' => 'Tanzania',
                'type' => 'Individual',
                'status' => 'active',
                'shipments' => 7,
                'revenue' => 12450,
                'since' => '2024-01-12',
                'notes' => null,
            ],
        ];

        foreach ($rows as $row) {
            Customer::create($row);
        }
    }
}
