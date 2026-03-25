<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ShipmentController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\FleetController;
use App\Http\Controllers\Api\RouteController;
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

Route::middleware('api')->group(function () {
    // Shipments
    Route::apiResource('shipments', ShipmentController::class);
    Route::patch('shipments/{shipment}/status', [ShipmentController::class, 'updateStatus']);
    Route::post('shipments/bulk-update', [ShipmentController::class, 'bulkUpdate']);
    Route::post('shipments/bulk-delete', [ShipmentController::class, 'bulkDelete']);
    Route::get('shipments/export/csv', [ShipmentController::class, 'exportCsv']);

    // Bookings
    Route::apiResource('bookings', BookingController::class);
    Route::patch('bookings/{booking}/status', [BookingController::class, 'updateStatus']);
    Route::post('bookings/{booking}/convert', [BookingController::class, 'convert']);

    // Fleet
    Route::apiResource('fleet', FleetController::class);
    Route::patch('fleet/{vehicle}/status', [FleetController::class, 'updateStatus']);

    // Routes
    Route::apiResource('routes', RouteController::class);
    Route::patch('routes/{route}/status', [RouteController::class, 'updateStatus']);

    // Warehouses
    Route::apiResource('warehouses', WarehouseController::class);

    // Locations (countries + cities from DB)
    Route::get('countries', [LocationController::class, 'countries']);
    Route::get('countries/{code}/cities', [LocationController::class, 'cities']);

    // Dashboard stats
    Route::get('dashboard/stats', function () {
        return response()->json([
            'message' => 'Connect to real data source to populate these stats',
        ]);
    });
});
