<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;

class LocationController extends Controller
{
    public function countries()
    {
        $countries = Country::orderBy('name')->get(['id', 'name', 'code']);
        return response()->json($countries);
    }

    public function cities(string $code)
    {
        $country = Country::where('code', strtoupper($code))->firstOrFail();
        $cities = $country->cities()->pluck('name');
        return response()->json($cities);
    }
}
