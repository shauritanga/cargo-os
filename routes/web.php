<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| All requests are directed to the SPA blade view.
| The React frontend handles all routing client-side.
|
*/

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
