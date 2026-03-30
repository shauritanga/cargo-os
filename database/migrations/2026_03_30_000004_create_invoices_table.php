<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->string('customer');
            $table->string('shipment_ref')->nullable();
            $table->string('currency', 10)->default('TZS');
            $table->decimal('amount', 14, 2)->default(0);
            $table->enum('status', ['paid', 'pending', 'overdue', 'draft'])->default('draft');
            $table->date('issued');
            $table->date('due');
            $table->json('items');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'currency']);
            $table->index('customer');
            $table->index(['issued', 'due']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
