<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PublicBookingController;
use App\Http\Controllers\PublicTrackingController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| All requests are directed to the SPA blade view.
| The React frontend handles all routing client-side.
|
*/

Route::get('/public/booking', [PublicBookingController::class, 'showForm'])->name('public.booking.form');
Route::post('/public/booking', [PublicBookingController::class, 'submit'])->middleware('throttle:5,1')->name('public.booking.submit');
Route::get('/public/booking/countries/{code}/cities', [PublicBookingController::class, 'cities'])->name('public.booking.cities');
Route::get('/public/tracking', [PublicTrackingController::class, 'show'])->middleware('throttle:30,1')->name('public.tracking.form');

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
