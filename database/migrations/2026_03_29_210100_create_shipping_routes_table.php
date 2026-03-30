<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_routes', function (Blueprint $table) {
            $table->id();
            $table->string('origin');
            $table->string('origin_c', 10)->nullable();
            $table->string('dest');
            $table->string('dest_c', 10)->nullable();
            $table->enum('mode', ['Sea', 'Air', 'Road', 'Rail']);
            $table->enum('type', ['international', 'domestic']);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedSmallInteger('avg_days')->default(0);
            $table->unsignedInteger('shipments')->default(0);
            $table->string('freq', 100)->default('Weekly');
            $table->string('carrier')->nullable();
            $table->timestamps();

            $table->index(['status', 'mode', 'type']);
            $table->index(['origin', 'dest']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_routes');
    }
};
