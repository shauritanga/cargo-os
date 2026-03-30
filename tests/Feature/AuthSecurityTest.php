<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_rate_limited_after_repeated_failed_attempts(): void
    {
        User::factory()->create([
            'email' => 'admin@rtexpress.co.tz',
            'password' => 'StrongPassword!123',
            'is_active' => true,
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email' => 'admin@rtexpress.co.tz',
                'password' => 'WrongPassword!123',
            ])->assertStatus(422);
        }

        $this->postJson('/api/login', [
            'email' => 'admin@rtexpress.co.tz',
            'password' => 'WrongPassword!123',
        ])
            ->assertStatus(429)
            ->assertJsonStructure(['message']);
    }

    public function test_successful_login_clears_failed_attempt_counter(): void
    {
        User::factory()->create([
            'email' => 'admin@rtexpress.co.tz',
            'password' => 'StrongPassword!123',
            'is_active' => true,
        ]);

        for ($i = 0; $i < 2; $i++) {
            $this->postJson('/api/login', [
                'email' => 'admin@rtexpress.co.tz',
                'password' => 'WrongPassword!123',
            ])->assertStatus(422);
        }

        $this->postJson('/api/login', [
            'email' => 'admin@rtexpress.co.tz',
            'password' => 'StrongPassword!123',
        ])->assertOk();

        $this->postJson('/api/login', [
            'email' => 'admin@rtexpress.co.tz',
            'password' => 'WrongPassword!123',
        ])->assertStatus(422);
    }

    public function test_user_creation_requires_strong_password(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->postJson('/api/users', [
            'name' => 'Weak Password User',
            'email' => 'weak@rtexpress.co.tz',
            'password' => 'password123',
            'is_active' => true,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
