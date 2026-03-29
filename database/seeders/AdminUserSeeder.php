<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::query()->updateOrCreate(
            ['name' => 'admin'],
            ['description' => 'System administrator with full access']
        );

        $user = User::query()->updateOrCreate(
            ['email' => 'admin@rtexpress.co.tz'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('admin123'),
                'is_active' => true,
            ]
        );

        $user->roles()->syncWithoutDetaching([$adminRole->id]);
    }
}
