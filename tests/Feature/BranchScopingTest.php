<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Invoice;
use App\Models\Permission;
use App\Models\Role;
use App\Models\ShippingRoute;
use App\Models\Shipment;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\FleetVehicle;
use App\Models\Customer;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchScopingTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_only_sees_shipments_in_own_branch(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $branchA = Branch::query()->create(['name' => 'Branch A', 'code' => 'BRA', 'is_active' => true]);
        $branchB = Branch::query()->create(['name' => 'Branch B', 'code' => 'BRB', 'is_active' => true]);

        $user = User::factory()->create(['is_active' => true, 'branch_id' => $branchA->id]);
        $readPermission = Permission::query()->where('key', 'shipments.read')->firstOrFail();
        $user->directPermissions()->sync([$readPermission->id]);

        Shipment::create([
            'branch_id' => $branchA->id,
            'awb_number' => '025500010001',
            'type' => 'domestic',
            'origin' => 'Dar',
            'origin_country' => 'TZ',
            'dest' => 'Moro',
            'dest_country' => 'TZ',
            'customer' => 'A Customer',
            'weight' => 10,
            'mode' => 'Road',
            'cargo_type' => 'General',
            'status' => 'pending',
        ]);

        Shipment::create([
            'branch_id' => $branchB->id,
            'awb_number' => '025500010002',
            'type' => 'domestic',
            'origin' => 'Arusha',
            'origin_country' => 'TZ',
            'dest' => 'Moshi',
            'dest_country' => 'TZ',
            'customer' => 'B Customer',
            'weight' => 12,
            'mode' => 'Road',
            'cargo_type' => 'General',
            'status' => 'pending',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/shipments')->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('025500010001', $response->json('data.0.awb_number'));
    }

    public function test_admin_can_view_all_branches_shipments(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $branchA = Branch::query()->create(['name' => 'Branch A', 'code' => 'BRA', 'is_active' => true]);
        $branchB = Branch::query()->create(['name' => 'Branch B', 'code' => 'BRB', 'is_active' => true]);

        $admin = User::factory()->create(['is_active' => true, 'branch_id' => $branchA->id]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $readPermission = Permission::query()->where('key', 'shipments.read')->firstOrFail();
        $admin->directPermissions()->sync([$readPermission->id]);

        Shipment::create([
            'branch_id' => $branchA->id,
            'awb_number' => '025500020001',
            'type' => 'domestic',
            'origin' => 'Dar',
            'origin_country' => 'TZ',
            'dest' => 'Moro',
            'dest_country' => 'TZ',
            'customer' => 'A Customer',
            'weight' => 10,
            'mode' => 'Road',
            'cargo_type' => 'General',
            'status' => 'pending',
        ]);

        Shipment::create([
            'branch_id' => $branchB->id,
            'awb_number' => '025500020002',
            'type' => 'domestic',
            'origin' => 'Arusha',
            'origin_country' => 'TZ',
            'dest' => 'Moshi',
            'dest_country' => 'TZ',
            'customer' => 'B Customer',
            'weight' => 12,
            'mode' => 'Road',
            'cargo_type' => 'General',
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'web');

        $response = $this->getJson('/api/shipments')->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_created_operational_records_default_to_main_branch(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $mainBranchId = Branch::resolveDefaultId();
        $otherBranch = Branch::query()->create([
            'name' => 'Branch C',
            'code' => 'BRC',
            'is_active' => true,
        ]);

        $admin = User::factory()->create([
            'is_active' => true,
            'branch_id' => $otherBranch->id,
        ]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);
        $this->grantCreatePermissions($admin);
        $this->actingAs($admin, 'web');

        $this->postJson('/api/shipments', [
            'type' => 'domestic',
            'origin' => 'Dar',
            'dest' => 'Moro',
            'customer' => 'Admin Shipment',
            'mode' => 'Road',
            'cargo_type' => 'General',
        ])->assertCreated();

        $this->postJson('/api/fleet', [
            'type' => 'Truck',
            'make' => 'Sinotruk',
            'plate' => 'T 123 ABC',
        ])->assertCreated();

        $this->postJson('/api/routes', [
            'origin' => 'Dar',
            'dest' => 'Arusha',
            'mode' => 'Road',
            'type' => 'domestic',
        ])->assertCreated();

        $this->postJson('/api/warehouses', [
            'name' => 'Admin WH',
            'city' => 'Dar',
        ])->assertCreated();

        $this->postJson('/api/customers', [
            'name' => 'Admin Customer',
        ])->assertCreated();

        $this->postJson('/api/billing/invoices', [
            'customer' => 'Admin Customer',
            'issued' => now()->toDateString(),
            'due' => now()->addDays(7)->toDateString(),
            'items' => [
                ['description' => 'Handling', 'qty' => 1, 'rate' => 50000],
            ],
        ])->assertCreated();

        $this->assertSame($mainBranchId, (int) Shipment::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($mainBranchId, (int) FleetVehicle::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($mainBranchId, (int) ShippingRoute::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($mainBranchId, (int) Warehouse::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($mainBranchId, (int) Customer::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($mainBranchId, (int) Invoice::query()->latest('id')->firstOrFail()->branch_id);
    }

    public function test_non_admin_created_operational_records_use_creator_branch(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $branch = Branch::query()->create([
            'name' => 'Branch D',
            'code' => 'BRD',
            'is_active' => true,
        ]);

        $operator = User::factory()->create([
            'is_active' => true,
            'branch_id' => $branch->id,
        ]);
        $this->grantCreatePermissions($operator);
        $this->actingAs($operator, 'web');

        $this->postJson('/api/shipments', [
            'type' => 'domestic',
            'origin' => 'Mwanza',
            'dest' => 'Dodoma',
            'customer' => 'Ops Shipment',
            'mode' => 'Road',
            'cargo_type' => 'General',
        ])->assertCreated();

        $this->postJson('/api/fleet', [
            'type' => 'Truck',
            'make' => 'FAW',
            'plate' => 'T 456 DEF',
        ])->assertCreated();

        $this->postJson('/api/routes', [
            'origin' => 'Mwanza',
            'dest' => 'Kigoma',
            'mode' => 'Road',
            'type' => 'domestic',
        ])->assertCreated();

        $this->postJson('/api/warehouses', [
            'name' => 'Ops WH',
            'city' => 'Mwanza',
        ])->assertCreated();

        $this->postJson('/api/customers', [
            'name' => 'Ops Customer',
        ])->assertCreated();

        $this->postJson('/api/billing/invoices', [
            'customer' => 'Ops Customer',
            'issued' => now()->toDateString(),
            'due' => now()->addDays(10)->toDateString(),
            'items' => [
                ['description' => 'Transport', 'qty' => 2, 'rate' => 70000],
            ],
        ])->assertCreated();

        $this->assertSame($branch->id, (int) Shipment::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($branch->id, (int) FleetVehicle::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($branch->id, (int) ShippingRoute::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($branch->id, (int) Warehouse::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($branch->id, (int) Customer::query()->latest('id')->firstOrFail()->branch_id);
        $this->assertSame($branch->id, (int) Invoice::query()->latest('id')->firstOrFail()->branch_id);
    }

    private function grantCreatePermissions(User $user): void
    {
        $ids = Permission::query()
            ->whereIn('key', [
                'shipments.create',
                'fleet.create',
                'routes.create',
                'warehouses.create',
                'customers.create',
                'billing.create',
            ])
            ->pluck('id')
            ->all();

        $user->directPermissions()->sync($ids);
    }
}
