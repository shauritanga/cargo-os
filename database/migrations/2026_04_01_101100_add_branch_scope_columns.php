<?php

use App\Models\Branch;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'users',
        'shipments',
        'bookings',
        'customers',
        'warehouses',
        'fleet_vehicles',
        'shipping_routes',
        'invoices',
        'audit_logs',
        'shipment_status_events',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->nullOnDelete();
                $table->index('branch_id');
            });
        }

        $defaultBranchId = Branch::query()->firstOrCreate(
            ['code' => Branch::DEFAULT_CODE],
            ['name' => 'Main Branch', 'is_active' => true]
        )->id;

        foreach ($this->tables as $tableName) {
            DB::table($tableName)->whereNull('branch_id')->update(['branch_id' => $defaultBranchId]);
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropForeign(['branch_id']);
                $table->dropIndex(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }
    }
};
