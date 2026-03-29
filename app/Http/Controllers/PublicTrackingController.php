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

        if ($query !== '') {
            $shipmentQuery = Shipment::query()
                ->with(['statusEvents' => fn($builder) => $builder->orderBy('occurred_at')])
                ->where('awb_number', 'ilike', $query);

            if (ctype_digit($query)) {
                $shipmentQuery->orWhere('id', (int) $query);
            }

            $shipment = $shipmentQuery->first();
        }

        return view('public-tracking', [
            'query' => $query,
            'shipment' => $shipment,
        ]);
    }
}
