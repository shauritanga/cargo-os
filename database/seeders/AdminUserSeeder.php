<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $adminEmail = (string) env('ADMIN_BOOTSTRAP_EMAIL', 'admin@rtexpress.co.tz');
        $adminPassword = (string) env('ADMIN_BOOTSTRAP_PASSWORD', '');

        $adminRole = Role::query()->updateOrCreate(
            ['name' => 'admin'],
            ['description' => 'System administrator with full access']
        );

        $user = User::query()->where('email', $adminEmail)->first();

        if ($user === null && $adminPassword === '') {
            if (app()->environment('production')) {
                throw new \RuntimeException('Missing ADMIN_BOOTSTRAP_PASSWORD for production seeding.');
            }

            $adminPassword = Str::random(24);
            if ($this->command !== null) {
                $this->command->warn("Generated ADMIN_BOOTSTRAP_PASSWORD for {$adminEmail}: {$adminPassword}");
            }
        }

        if ($user === null) {
            $user = User::query()->create([
                'name' => 'Admin User',
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
                'is_active' => true,
            ]);
        } else {
            $user->name = 'Admin User';
            $user->is_active = true;

            if ($adminPassword !== '') {
                $user->password = Hash::make($adminPassword);
            }

            $user->save();
        }

        $user->roles()->syncWithoutDetaching([$adminRole->id]);
    }
}
