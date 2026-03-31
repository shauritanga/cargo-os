<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_be_created_without_email_and_with_full_party_fields(): void
    {
        $admin = $this->actingAdmin();

        $this->actingAs($admin, 'web');

        $response = $this->postJson('/api/customers', [
            'name' => 'Receiver Hub Ltd',
            'contact' => 'Grace Mushi',
            'email' => null,
            'phone' => '+255711223344',
            'country' => 'Tanzania',
            'country_code' => 'TZ',
            'city_town' => 'Dar es Salaam',
            'street_address' => 'Nyerere Road',
            'type' => 'SME',
            'status' => 'active',
            'notes' => 'Reusable receiver record',
        ]);

        $response
            ->assertCreated()
            ->assertJson([
                'name' => 'Receiver Hub Ltd',
                'email' => null,
                'country' => 'Tanzania',
                'country_code' => 'TZ',
                'city_town' => 'Dar es Salaam',
                'street_address' => 'Nyerere Road',
            ]);

        $this->assertDatabaseHas('customers', [
            'name' => 'Receiver Hub Ltd',
            'email' => null,
            'country' => 'Tanzania',
            'country_code' => 'TZ',
            'city_town' => 'Dar es Salaam',
            'street_address' => 'Nyerere Road',
        ]);
    }

    public function test_customer_email_is_optional_but_still_unique_when_present(): void
    {
        $admin = $this->actingAdmin();

        Customer::create([
            'name' => 'Sender One',
            'contact' => 'Sender Contact',
            'email' => 'sender@example.com',
            'phone' => '+255700100100',
            'country' => 'Tanzania',
            'country_code' => 'TZ',
            'city_town' => 'Mwanza',
            'street_address' => 'Makongoro Street',
            'type' => 'SME',
            'status' => 'active',
            'shipments' => 0,
            'revenue' => 0,
            'since' => now()->toDateString(),
        ]);

        $this->actingAs($admin, 'web');

        $this->postJson('/api/customers', [
            'name' => 'Sender Two',
            'email' => 'sender@example.com',
            'country' => 'Tanzania',
            'country_code' => 'TZ',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    private function actingAdmin(): User
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        return $admin;
    }
}
