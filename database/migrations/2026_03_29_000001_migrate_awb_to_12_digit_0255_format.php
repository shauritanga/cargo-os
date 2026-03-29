<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $shipments = DB::table('shipments')
                ->select('id', 'awb_number')
                ->orderBy('id')
                ->get();

            foreach ($shipments as $shipment) {
                DB::table('shipments')
                    ->where('id', $shipment->id)
                    ->update(['awb_number' => 'TMPAWB' . $shipment->id]);
            }

            $usedSequences = [];
            $maxSequence = 0;

            foreach ($shipments as $shipment) {
                $sequence = $this->extractSequence((string) $shipment->awb_number, (int) $shipment->id);

                while (isset($usedSequences[$sequence])) {
                    $sequence++;
                }

                $usedSequences[$sequence] = true;
                $maxSequence = max($maxSequence, $sequence);

                $newAwb = '0255' . str_pad((string) $sequence, 8, '0', STR_PAD_LEFT);

                DB::table('shipments')
                    ->where('id', $shipment->id)
                    ->update(['awb_number' => $newAwb]);
            }

            $currentSequence = (int) (DB::table('company_settings')->where('id', 1)->value('awb_last_sequence') ?? 0);
            $nextSequence = max($currentSequence, $maxSequence);

            DB::table('company_settings')->updateOrInsert(
                ['id' => 1],
                [
                    'awb_prefix' => '0255',
                    'awb_last_sequence' => $nextSequence,
                    'updated_at' => now(),
                ]
            );
        });
    }

    public function down(): void
    {
        DB::table('company_settings')->where('id', 1)->update([
            'awb_prefix' => '02019',
            'updated_at' => now(),
        ]);
    }

    private function extractSequence(string $awbNumber, int $fallback): int
    {
        $digitsOnly = preg_replace('/\D+/', '', $awbNumber) ?? '';

        if ($digitsOnly !== '') {
            if (str_starts_with($digitsOnly, '02019') && strlen($digitsOnly) > 5) {
                $parsed = (int) substr($digitsOnly, 5);
                if ($parsed > 0) {
                    return $parsed;
                }
            }

            if (str_starts_with($digitsOnly, '0255') && strlen($digitsOnly) > 4) {
                $parsed = (int) substr($digitsOnly, 4);
                if ($parsed > 0) {
                    return $parsed;
                }
            }

            if (preg_match('/(\d{1,8})$/', $digitsOnly, $matches) === 1) {
                $parsed = (int) $matches[1];
                if ($parsed > 0) {
                    return $parsed;
                }
            }
        }

        return max(1, $fallback);
    }
};
