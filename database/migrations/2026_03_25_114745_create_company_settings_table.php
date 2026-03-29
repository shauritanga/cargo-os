<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('RTEXPRESS');
            $table->string('address')->nullable();
            $table->string('country')->default('Tanzania');
            $table->string('currency', 10)->default('USD');
            $table->string('date_format', 20)->default('DD/MM/YYYY');
            $table->string('awb_prefix', 20)->default('0255');
            $table->unsignedBigInteger('awb_last_sequence')->default(0);
            $table->timestamps();
        });

        // Seed the single company settings row
        DB::table('company_settings')->insert([
            'name'              => 'RTEXPRESS',
            'address'           => 'Westlands, Nairobi',
            'country'           => 'Kenya',
            'currency'          => 'USD',
            'date_format'       => 'DD/MM/YYYY',
            'awb_prefix'        => '0255',
            'awb_last_sequence' => 0,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
