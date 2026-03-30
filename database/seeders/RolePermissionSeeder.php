<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * @var array<int, string>
     */
    private array $resources = [
        'shipments',
        'bookings',
        'fleet',
        'routes',
        'warehouses',
        'customers',
        'billing',
        'reports',
        'settings',
        'audit-logs',
    ];

    /**
     * @var array<int, string>
     */
    private array $actions = [
        'create',
        'read',
        'update',
        'delete',
    ];

    public function run(): void
    {
        $allPermissionIds = [];

        foreach ($this->resources as $resource) {
            foreach ($this->actions as $action) {
                $permission = Permission::query()->updateOrCreate(
                    ['key' => "{$resource}.{$action}"],
                    [
                        'resource' => $resource,
                        'action' => $action,
                        'description' => ucfirst($action) . " {$resource}",
                    ]
                );

                $allPermissionIds[] = $permission->id;
            }
        }

        $admin = Role::query()->updateOrCreate(
            ['name' => 'admin'],
            ['description' => 'System administrator with full access']
        );

        $operationsManager = Role::query()->updateOrCreate(
            ['name' => 'operations-manager'],
            ['description' => 'Operations manager with broad logistics access']
        );

        $operator = Role::query()->updateOrCreate(
            ['name' => 'operator'],
            ['description' => 'Day-to-day logistics operations user']
        );

        $admin->permissions()->sync($allPermissionIds);

        $managerPermissionKeys = [
            'shipments.create',
            'shipments.read',
            'shipments.update',
            'shipments.delete',
            'bookings.create',
            'bookings.read',
            'bookings.update',
            'bookings.delete',
            'fleet.read',
            'fleet.update',
            'routes.read',
            'routes.update',
            'warehouses.read',
            'warehouses.update',
            'customers.read',
            'billing.read',
            'reports.read',
            'settings.read',
        ];

        $operatorPermissionKeys = [
            'shipments.create',
            'shipments.read',
            'shipments.update',
            'bookings.create',
            'bookings.read',
            'bookings.update',
            'fleet.read',
            'routes.read',
            'warehouses.read',
            'customers.read',
            'billing.read',
            'reports.read',
        ];

        $operationsManager->permissions()->sync(
            Permission::query()->whereIn('key', $managerPermissionKeys)->pluck('id')->all()
        );

        $operator->permissions()->sync(
            Permission::query()->whereIn('key', $operatorPermissionKeys)->pluck('id')->all()
        );
    }
}
