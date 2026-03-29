<?php

namespace Tests\Feature;

use App\Models\CompanySettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AwbGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_shipment_generates_12_digit_awb_with_0255_prefix(): void
    {
        $response = $this->postJson('/api/shipments', $this->validShipmentPayload('Customer One'));

        $response->assertCreated();

        $awb = (string) $response->json('awb_number');

        $this->assertMatchesRegularExpression('/^0255\d{8}$/', $awb);
        $this->assertSame(12, strlen($awb));

        $settings = CompanySettings::findOrFail(1);
        $this->assertSame('0255', $settings->awb_prefix);
        $this->assertSame(1, (int) $settings->awb_last_sequence);
    }

    public function test_awb_sequence_increments_for_subsequent_shipments(): void
    {
        $first = $this->postJson('/api/shipments', $this->validShipmentPayload('Customer One'));
        $second = $this->postJson('/api/shipments', $this->validShipmentPayload('Customer Two'));

        $first->assertCreated();
        $second->assertCreated();

        $this->assertSame('025500000001', (string) $first->json('awb_number'));
        $this->assertSame('025500000002', (string) $second->json('awb_number'));
    }

    private function validShipmentPayload(string $customer): array
    {
        return [
            'type' => 'international',
            'origin' => 'Dar es Salaam',
            'origin_country' => 'TZ',
            'dest' => 'Nairobi',
            'dest_country' => 'KE',
            'customer' => $customer,
            'weight' => 10.5,
            'mode' => 'Air',
            'cargo_type' => 'General',
        ];
    }
}
