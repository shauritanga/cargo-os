<?php

namespace Database\Seeders;

use App\Models\Invoice;
use Illuminate\Database\Seeder;

class BillingInvoiceSeeder extends Seeder
{
    public function run(): void
    {
        if (Invoice::query()->exists()) {
            return;
        }

        $rows = [
            [
                'invoice_no' => 'INV-2026-0001',
                'customer' => 'Unilever Ltd',
                'shipment_ref' => 'SHG-22401',
                'currency' => 'TZS',
                'status' => 'paid',
                'issued' => '2026-01-10',
                'due' => '2026-02-10',
                'items' => [
                    ['description' => 'Sea Freight - Dar to Rotterdam', 'qty' => 1, 'rate' => 23500000],
                    ['description' => 'Port Handling Fees', 'qty' => 1, 'rate' => 4200000],
                    ['description' => 'Documentation', 'qty' => 1, 'rate' => 1800000],
                ],
                'amount' => 29500000,
                'notes' => null,
            ],
            [
                'invoice_no' => 'INV-2026-0002',
                'customer' => 'DHL Express',
                'shipment_ref' => 'SHG-22402',
                'currency' => 'TZS',
                'status' => 'pending',
                'issued' => '2026-02-15',
                'due' => '2026-03-15',
                'items' => [
                    ['description' => 'Air Freight - NBI to AMS', 'qty' => 3, 'rate' => 6500000],
                    ['description' => 'Customs Clearance', 'qty' => 1, 'rate' => 2200000],
                ],
                'amount' => 21700000,
                'notes' => 'Awaiting payment confirmation.',
            ],
            [
                'invoice_no' => 'INV-2026-0003',
                'customer' => 'Safaricom PLC',
                'shipment_ref' => 'DOM-10021',
                'currency' => 'TZS',
                'status' => 'overdue',
                'issued' => '2026-01-05',
                'due' => '2026-02-05',
                'items' => [
                    ['description' => 'Road Freight - Nairobi to Mombasa', 'qty' => 1, 'rate' => 7600000],
                    ['description' => 'Fuel Surcharge', 'qty' => 1, 'rate' => 900000],
                ],
                'amount' => 8500000,
                'notes' => 'Client follow-up in progress.',
            ],
            [
                'invoice_no' => 'INV-2026-0004',
                'customer' => 'Apple Inc.',
                'shipment_ref' => 'SHG-22407',
                'currency' => 'TZS',
                'status' => 'draft',
                'issued' => '2026-03-01',
                'due' => '2026-04-01',
                'items' => [
                    ['description' => 'Air Freight - Shanghai to Nairobi', 'qty' => 1, 'rate' => 28800000],
                    ['description' => 'Customs Brokerage', 'qty' => 1, 'rate' => 5900000],
                ],
                'amount' => 34700000,
                'notes' => 'Draft under review.',
            ],
        ];

        foreach ($rows as $row) {
            Invoice::create($row);
        }
    }
}
