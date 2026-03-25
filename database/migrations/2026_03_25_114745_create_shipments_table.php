<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('awb_number')->unique();
            $table->enum('type', ['international', 'domestic']);
            $table->string('origin');
            $table->string('origin_country', 10)->nullable();
            $table->string('dest');
            $table->string('dest_country', 10)->nullable();
            $table->string('customer');
            $table->decimal('weight', 10, 2)->default(0);
            $table->enum('mode', ['Sea', 'Air', 'Road', 'Rail']);
            $table->string('cargo_type')->default('General');
            $table->enum('status', ['transit', 'delivered', 'pending', 'delayed', 'customs'])->default('pending');
            $table->date('eta')->nullable();
            $table->string('contact')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('notes')->nullable();
            $table->string('declared_value')->nullable();
            $table->string('insurance')->nullable();
            $table->unsignedInteger('pieces')->default(1);
            $table->string('contents')->nullable();
            $table->jsonb('consignor')->nullable();
            $table->jsonb('consignee')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
