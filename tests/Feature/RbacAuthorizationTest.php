<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RbacAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_routes_forbid_non_admin_users(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $operator = User::factory()->create(['is_active' => true]);
        $operatorRole = Role::query()->where('name', 'operator')->firstOrFail();
        $operator->roles()->sync([$operatorRole->id]);

        $this->actingAs($operator, 'web');

        $this->getJson('/api/users')
            ->assertForbidden()
            ->assertJson(['message' => 'Forbidden.']);
    }

    public function test_admin_routes_allow_admin_users(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->getJson('/api/users')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_permission_middleware_blocks_users_without_required_permission(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create(['is_active' => true]);
        $this->actingAs($user, 'web');

        $this->getJson('/api/shipments')
            ->assertForbidden()
            ->assertJson(['message' => 'Forbidden.']);
    }

    public function test_permission_middleware_allows_users_with_direct_permission(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create(['is_active' => true]);
        $permission = Permission::query()->where('key', 'shipments.read')->firstOrFail();
        $user->directPermissions()->sync([$permission->id]);

        $this->actingAs($user, 'web');

        $this->getJson('/api/shipments')->assertOk();
    }

    public function test_inactive_users_are_blocked_even_when_they_have_permission(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create(['is_active' => false]);
        $permission = Permission::query()->where('key', 'shipments.read')->firstOrFail();
        $user->directPermissions()->sync([$permission->id]);

        $this->actingAs($user, 'web');

        $this->getJson('/api/shipments')
            ->assertForbidden()
            ->assertJson(['message' => 'User account is inactive.']);
    }

    public function test_cannot_deactivate_last_active_admin(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->patchJson("/api/users/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'is_active' => false,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['user']);
    }

    public function test_cannot_remove_admin_role_from_last_active_admin(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $operatorRole = Role::query()->where('name', 'operator')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->postJson("/api/users/{$admin->id}/roles", [
            'role_ids' => [$operatorRole->id],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['user']);
    }

    public function test_admin_role_name_cannot_be_changed(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->putJson("/api/roles/{$adminRole->id}", [
            'name' => 'super-admin',
            'description' => 'Renamed admin role',
        ])
            ->assertStatus(422)
            ->assertJson(['message' => 'Admin role name cannot be changed.']);
    }

    public function test_admin_role_cannot_be_deleted(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->deleteJson("/api/roles/{$adminRole->id}")
            ->assertStatus(422)
            ->assertJson(['message' => 'Admin role cannot be deleted.']);
    }

    public function test_assign_permissions_to_role_requires_valid_permission_ids_payload(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $operatorRole = Role::query()->where('name', 'operator')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->postJson("/api/roles/{$operatorRole->id}/permissions", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['permission_ids']);

        $this->postJson("/api/roles/{$operatorRole->id}/permissions", [
            'permission_ids' => [999999],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['permission_ids.0']);
    }

    public function test_assign_roles_to_user_requires_existing_role_ids(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $targetUser = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->postJson("/api/users/{$targetUser->id}/roles", [
            'role_ids' => [999999],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role_ids.0']);
    }

    public function test_assign_direct_permissions_to_user_requires_existing_permission_ids(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $targetUser = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->postJson("/api/users/{$targetUser->id}/permissions", [
            'permission_ids' => [999999],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['permission_ids.0']);
    }

    public function test_assign_permissions_to_role_persists_and_returns_permissions(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $operatorRole = Role::query()->where('name', 'operator')->firstOrFail();
        $permissions = Permission::query()
            ->whereIn('key', ['shipments.read', 'shipments.create'])
            ->pluck('id')
            ->all();

        $admin->roles()->sync([$adminRole->id]);
        $this->actingAs($admin, 'web');

        $response = $this->postJson("/api/roles/{$operatorRole->id}/permissions", [
            'permission_ids' => $permissions,
        ]);

        $response
            ->assertOk()
            ->assertJsonCount(2, 'permissions');

        foreach ($permissions as $permissionId) {
            $this->assertDatabaseHas('permission_role', [
                'role_id' => $operatorRole->id,
                'permission_id' => $permissionId,
            ]);
        }
    }

    public function test_assign_roles_to_user_persists_and_returns_roles(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $targetUser = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $operatorRole = Role::query()->where('name', 'operator')->firstOrFail();

        $admin->roles()->sync([$adminRole->id]);
        $this->actingAs($admin, 'web');

        $this->postJson("/api/users/{$targetUser->id}/roles", [
            'role_ids' => [$operatorRole->id],
        ])
            ->assertOk()
            ->assertJsonFragment(['name' => 'operator']);

        $this->assertDatabaseHas('role_user', [
            'user_id' => $targetUser->id,
            'role_id' => $operatorRole->id,
        ]);
    }

    public function test_assign_direct_permissions_to_user_persists_and_returns_direct_permissions(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $targetUser = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $permission = Permission::query()->where('key', 'reports.read')->firstOrFail();

        $admin->roles()->sync([$adminRole->id]);
        $this->actingAs($admin, 'web');

        $this->postJson("/api/users/{$targetUser->id}/permissions", [
            'permission_ids' => [$permission->id],
        ])
            ->assertOk()
            ->assertJsonFragment(['key' => 'reports.read']);

        $this->assertDatabaseHas('permission_user', [
            'user_id' => $targetUser->id,
            'permission_id' => $permission->id,
        ]);
    }

    public function test_role_assigned_permission_appears_in_effective_permissions(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $targetUser = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $operatorRole = Role::query()->where('name', 'operator')->firstOrFail();
        $permission = Permission::query()->where('key', 'shipments.read')->firstOrFail();

        $admin->roles()->sync([$adminRole->id]);
        $this->actingAs($admin, 'web');

        $this->postJson("/api/roles/{$operatorRole->id}/permissions", [
            'permission_ids' => [$permission->id],
        ])->assertOk();

        $response = $this->postJson("/api/users/{$targetUser->id}/roles", [
            'role_ids' => [$operatorRole->id],
        ]);

        $response
            ->assertOk()
            ->assertJsonFragment(['name' => 'operator'])
            ->assertJsonFragment(['effective_permissions' => ['shipments.read']]);
    }
}
