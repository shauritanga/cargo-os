<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('country_code', 10)->nullable()->after('country');
            $table->string('city_town')->nullable()->after('country_code');
            $table->string('street_address')->nullable()->after('city_town');
            $table->string('email')->nullable()->change();
        });

        $countryCodeMap = [
            'tanzania' => 'TZ',
            'kenya' => 'KE',
            'uganda' => 'UG',
            'rwanda' => 'RW',
            'burundi' => 'BI',
            'south africa' => 'ZA',
            'united states' => 'US',
            'usa' => 'US',
            'united kingdom' => 'GB',
            'uk' => 'GB',
        ];

        DB::table('customers')
            ->select(['id', 'country'])
            ->orderBy('id')
            ->get()
            ->each(function (object $customer) use ($countryCodeMap): void {
                $country = mb_strtolower(trim((string) ($customer->country ?? '')));
                $countryCode = $countryCodeMap[$country] ?? null;

                DB::table('customers')
                    ->where('id', $customer->id)
                    ->update([
                        'country_code' => $countryCode,
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['country_code', 'city_town', 'street_address']);
            $table->string('email')->nullable(false)->change();
        });
    }
};
