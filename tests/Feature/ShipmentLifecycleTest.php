<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Shipment;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShipmentLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_invalid_status_transition_is_blocked_without_override(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create(['is_active' => true]);
        $permission = Permission::query()->where('key', 'shipments.update')->firstOrFail();
        $user->directPermissions()->sync([$permission->id]);

        $shipment = $this->createShipment('pending');

        $this->actingAs($user, 'web');

        $this->patchJson("/api/shipments/{$shipment->id}/status", [
            'status' => 'delivered',
            'occurred_at' => now()->toISOString(),
            'recipient_name' => 'Jane Receiver',
            'recipient_phone' => '+255711111111',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'status' => 'pending',
        ]);
    }

    public function test_transition_creates_status_event_record(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create(['is_active' => true]);
        $permission = Permission::query()->where('key', 'shipments.update')->firstOrFail();
        $user->directPermissions()->sync([$permission->id]);

        $shipment = $this->createShipment('pending');

        $this->actingAs($user, 'web');

        $this->patchJson("/api/shipments/{$shipment->id}/status", [
            'status' => 'transit',
            'reason' => 'Picked up from origin facility',
            'occurred_at' => now()->toISOString(),
        ])
            ->assertOk();

        $this->assertDatabaseHas('shipment_status_events', [
            'shipment_id' => $shipment->id,
            'previous_status' => 'pending',
            'new_status' => 'transit',
            'is_override' => false,
            'triggered_by' => $user->id,
        ]);
    }

    public function test_admin_override_allows_invalid_transition_with_reason(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $shipment = $this->createShipment('pending');

        $this->actingAs($admin, 'web');

        $this->patchJson("/api/shipments/{$shipment->id}/status", [
            'status' => 'delivered',
            'override' => true,
            'override_reason' => 'Manual correction after carrier backfill.',
            'occurred_at' => now()->toISOString(),
            'recipient_name' => 'John Receiver',
            'recipient_phone' => '+255722222222',
        ])
            ->assertOk();

        $this->assertDatabaseHas('shipments', [
            'id' => $shipment->id,
            'status' => 'delivered',
        ]);

        $this->assertDatabaseHas('shipment_status_events', [
            'shipment_id' => $shipment->id,
            'previous_status' => 'pending',
            'new_status' => 'delivered',
            'is_override' => true,
            'override_reason' => 'Manual correction after carrier backfill.',
            'triggered_by' => $admin->id,
        ]);
    }

    private function createShipment(string $status): Shipment
    {
        return Shipment::create([
            'awb_number' => '025512340001',
            'type' => 'domestic',
            'origin' => 'Dar es Salaam',
            'origin_country' => 'TZ',
            'dest' => 'Arusha',
            'dest_country' => 'TZ',
            'customer' => 'Lifecycle Test Customer',
            'weight' => 120.5,
            'mode' => 'Road',
            'cargo_type' => 'General',
            'status' => $status,
            'contact' => 'Ops Contact',
            'email' => 'ops@example.com',
            'phone' => '+255700000000',
            'pieces' => 1,
            'contents' => 'Test contents',
        ]);
    }
}
