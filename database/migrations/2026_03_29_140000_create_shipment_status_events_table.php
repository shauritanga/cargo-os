<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipment_status_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained('shipments')->cascadeOnDelete();
            $table->enum('previous_status', ['transit', 'delivered', 'pending', 'delayed', 'customs'])->nullable();
            $table->enum('new_status', ['transit', 'delivered', 'pending', 'delayed', 'customs']);
            $table->text('reason')->nullable();
            $table->boolean('is_override')->default(false);
            $table->text('override_reason')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->foreignId('triggered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();

            $table->index(['shipment_id', 'occurred_at']);
            $table->index(['new_status', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_status_events');
    }
};
