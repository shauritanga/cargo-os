<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PublicTrackingController extends Controller
{
    public function show(Request $request): View
    {
        $query = trim((string) $request->query('q', ''));
        $shipment = null;

        if ($query !== '' && preg_match('/^[A-Za-z0-9\-\s]{6,30}$/', $query) === 1) {
            $awb = strtoupper(preg_replace('/\s+/', ' ', $query) ?? $query);
            $awbNormalized = strtolower($awb);

            $shipment = Shipment::query()
                ->with(['statusEvents' => fn($builder) => $builder->orderBy('occurred_at')])
                ->whereRaw('LOWER(awb_number) = ?', [$awbNormalized])
                ->first();
        }

        return view('public-tracking', [
            'query' => $query,
            'shipment' => $shipment,
        ]);
    }
}
