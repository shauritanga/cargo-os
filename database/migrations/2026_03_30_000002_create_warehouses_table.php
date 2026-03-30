<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('city');
            $table->string('country', 10)->default('TZ');
            $table->enum('type', ['General', 'Cold Storage', 'Hazardous', 'Bonded'])->default('General');
            $table->unsignedInteger('capacity_sqm')->default(0);
            $table->unsignedInteger('used_sqm')->default(0);
            $table->unsignedInteger('active_loads')->default(0);
            $table->string('manager')->nullable();
            $table->enum('status', ['operational', 'maintenance', 'closed'])->default('operational');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'type']);
            $table->index(['city', 'country']);
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
