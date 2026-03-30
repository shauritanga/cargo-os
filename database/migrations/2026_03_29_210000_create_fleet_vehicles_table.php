<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fleet_vehicles', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['Truck', 'Ship', 'Aircraft', 'Rail']);
            $table->string('make');
            $table->string('plate');
            $table->string('driver')->nullable();
            $table->decimal('capacity_tons', 10, 2)->default(0);
            $table->string('current_route')->nullable();
            $table->date('last_service')->nullable();
            $table->date('next_service')->nullable();
            $table->unsignedInteger('mileage')->default(0);
            $table->string('fuel_type', 100)->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->enum('status', ['active', 'idle', 'maintenance', 'retired'])->default('idle');
            $table->text('notes')->nullable();
            $table->string('base')->nullable();
            $table->timestamps();

            $table->index(['status', 'type']);
            $table->index('plate');
            $table->index('next_service');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fleet_vehicles');
    }
};
