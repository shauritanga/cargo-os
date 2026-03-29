<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ShipmentController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\FleetController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RouteController;
use App\Http\Controllers\Api\UserManagementController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\LocationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| RESTful API endpoints for the CargoOS logistics dashboard.
| Currently the frontend uses in-memory mock data, but these endpoints
| are ready to connect to a real database via the controllers.
|
*/

Route::middleware(['web', 'guest'])->group(function () {
    Route::post('login', [AuthController::class, 'login']);
});

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);

    // Shipments
    Route::get('shipments', [ShipmentController::class, 'index'])->middleware('permission:shipments.read');
    Route::post('shipments', [ShipmentController::class, 'store'])->middleware('permission:shipments.create');
    Route::get('shipments/{shipment}', [ShipmentController::class, 'show'])->middleware('permission:shipments.read');
    Route::put('shipments/{shipment}', [ShipmentController::class, 'update'])->middleware('permission:shipments.update');
    Route::patch('shipments/{shipment}', [ShipmentController::class, 'update'])->middleware('permission:shipments.update');
    Route::delete('shipments/{shipment}', [ShipmentController::class, 'destroy'])->middleware('permission:shipments.delete');
    Route::patch('shipments/{shipment}/status', [ShipmentController::class, 'updateStatus'])->middleware('permission:shipments.update');
    Route::post('shipments/bulk-update', [ShipmentController::class, 'bulkUpdate'])->middleware('permission:shipments.update');
    Route::post('shipments/bulk-delete', [ShipmentController::class, 'bulkDelete'])->middleware('permission:shipments.delete');
    Route::get('shipments/export/csv', [ShipmentController::class, 'exportCsv'])->middleware('permission:shipments.read');

    // Bookings
    Route::get('bookings', [BookingController::class, 'index'])->middleware('permission:bookings.read');
    Route::post('bookings', [BookingController::class, 'store'])->middleware('permission:bookings.create');
    Route::get('bookings/{booking}', [BookingController::class, 'show'])->middleware('permission:bookings.read');
    Route::put('bookings/{booking}', [BookingController::class, 'update'])->middleware('permission:bookings.update');
    Route::patch('bookings/{booking}', [BookingController::class, 'update'])->middleware('permission:bookings.update');
    Route::delete('bookings/{booking}', [BookingController::class, 'destroy'])->middleware('permission:bookings.delete');
    Route::patch('bookings/{booking}/status', [BookingController::class, 'updateStatus'])->middleware('permission:bookings.update');
    Route::post('bookings/{booking}/convert', [BookingController::class, 'convert'])->middleware('permission:bookings.update');

    // Fleet
    Route::get('fleet', [FleetController::class, 'index'])->middleware('permission:fleet.read');
    Route::post('fleet', [FleetController::class, 'store'])->middleware('permission:fleet.create');
    Route::get('fleet/{vehicle}', [FleetController::class, 'show'])->middleware('permission:fleet.read');
    Route::put('fleet/{vehicle}', [FleetController::class, 'update'])->middleware('permission:fleet.update');
    Route::patch('fleet/{vehicle}', [FleetController::class, 'update'])->middleware('permission:fleet.update');
    Route::delete('fleet/{vehicle}', [FleetController::class, 'destroy'])->middleware('permission:fleet.delete');
    Route::patch('fleet/{vehicle}/status', [FleetController::class, 'updateStatus'])->middleware('permission:fleet.update');

    // Routes
    Route::get('routes', [RouteController::class, 'index'])->middleware('permission:routes.read');
    Route::post('routes', [RouteController::class, 'store'])->middleware('permission:routes.create');
    Route::get('routes/{route}', [RouteController::class, 'show'])->middleware('permission:routes.read');
    Route::put('routes/{route}', [RouteController::class, 'update'])->middleware('permission:routes.update');
    Route::patch('routes/{route}', [RouteController::class, 'update'])->middleware('permission:routes.update');
    Route::delete('routes/{route}', [RouteController::class, 'destroy'])->middleware('permission:routes.delete');
    Route::patch('routes/{route}/status', [RouteController::class, 'updateStatus'])->middleware('permission:routes.update');

    // Warehouses
    Route::get('warehouses', [WarehouseController::class, 'index'])->middleware('permission:warehouses.read');
    Route::post('warehouses', [WarehouseController::class, 'store'])->middleware('permission:warehouses.create');
    Route::get('warehouses/{warehouse}', [WarehouseController::class, 'show'])->middleware('permission:warehouses.read');
    Route::put('warehouses/{warehouse}', [WarehouseController::class, 'update'])->middleware('permission:warehouses.update');
    Route::patch('warehouses/{warehouse}', [WarehouseController::class, 'update'])->middleware('permission:warehouses.update');
    Route::delete('warehouses/{warehouse}', [WarehouseController::class, 'destroy'])->middleware('permission:warehouses.delete');

    // Locations
    Route::get('countries', [LocationController::class, 'countries'])->middleware('permission:shipments.read');
    Route::get('countries/{code}/cities', [LocationController::class, 'cities'])->middleware('permission:shipments.read');

    // Dashboard stats
    Route::get('dashboard/stats', function () {
        return response()->json([
            'message' => 'Connect to real data source to populate these stats',
        ]);
    })->middleware('permission:reports.read');

    // RBAC (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('roles', RoleController::class)->except(['create', 'edit']);
        Route::post('roles/{role}/permissions', [RoleController::class, 'assignPermissions']);

        Route::apiResource('permissions', PermissionController::class)->except(['create', 'edit', 'show']);

        Route::get('users', [UserManagementController::class, 'index']);
        Route::post('users', [UserManagementController::class, 'store']);
        Route::put('users/{user}', [UserManagementController::class, 'update']);
        Route::patch('users/{user}', [UserManagementController::class, 'update']);
        Route::post('users/{user}/roles', [UserManagementController::class, 'assignRoles']);
        Route::post('users/{user}/permissions', [UserManagementController::class, 'assignDirectPermissions']);
    });
});
