<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_paginated_audit_logs(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->postJson('/api/users', [
            'name' => 'Audit Pagination User',
            'email' => 'audit.pagination@example.com',
            'password' => 'StrongPass!1234',
            'is_active' => true,
        ])->assertCreated();

        $this->getJson('/api/audit-logs')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'current_page',
                'last_page',
                'total',
            ]);

        $this->assertDatabaseHas('audit_logs', [
            'path' => '/api/users',
            'http_method' => 'POST',
        ]);
    }

    public function test_non_admin_cannot_view_audit_logs(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $operator = User::factory()->create(['is_active' => true]);
        $operatorRole = Role::query()->where('name', 'operator')->firstOrFail();
        $operator->roles()->sync([$operatorRole->id]);

        $this->actingAs($operator, 'web');

        $this->getJson('/api/audit-logs')
            ->assertForbidden()
            ->assertJson(['message' => 'Forbidden.']);
    }

    public function test_sensitive_fields_are_redacted_in_audit_request_payload(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->postJson('/api/users', [
            'name' => 'Audit Target User',
            'email' => 'audit.target@example.com',
            'password' => 'StrongPass!1234',
            'is_active' => true,
        ])->assertCreated();

        $entry = AuditLog::query()
            ->where('path', '/api/users')
            ->where('http_method', 'POST')
            ->latest('id')
            ->first();

        $this->assertNotNull($entry);
        $this->assertSame('[REDACTED]', $entry->request_data['password'] ?? null);
    }

    public function test_audit_log_listing_endpoint_is_not_self_logged(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create(['is_active' => true]);
        $adminRole = Role::query()->where('name', 'admin')->firstOrFail();
        $admin->roles()->sync([$adminRole->id]);

        $this->actingAs($admin, 'web');

        $this->getJson('/api/audit-logs')->assertOk();

        $this->assertDatabaseMissing('audit_logs', [
            'path' => '/api/audit-logs',
            'http_method' => 'GET',
        ]);
    }
}
