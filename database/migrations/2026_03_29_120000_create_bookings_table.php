<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('customer');
            $table->string('origin');
            $table->string('dest');
            $table->enum('mode', ['Sea', 'Air', 'Road', 'Rail']);
            $table->string('type');
            $table->decimal('weight', 10, 2)->default(1);
            $table->unsignedInteger('containers')->default(1);
            $table->enum('urgency', ['high', 'medium', 'low'])->default('medium');
            $table->enum('status', ['new', 'reviewing', 'approved', 'converted', 'rejected'])->default('new');
            $table->string('contact')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('message')->nullable();
            $table->string('converted_to')->nullable();
            $table->string('assigned_to')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
