<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fleet_vehicles', function (Blueprint $table) {
            $table->foreignId('route_id')
                ->nullable()
                ->after('current_route')
                ->constrained('shipping_routes')
                ->nullOnDelete();
        });

        $routeLookup = DB::table('shipping_routes')
            ->select(['id', 'origin', 'dest'])
            ->get()
            ->mapWithKeys(function (object $route): array {
                $key = trim((string) $route->origin) . ' -> ' . trim((string) $route->dest);
                return [$key => (int) $route->id];
            });

        DB::table('fleet_vehicles')
            ->select(['id', 'current_route'])
            ->orderBy('id')
            ->chunkById(200, function ($vehicles) use ($routeLookup): void {
                foreach ($vehicles as $vehicle) {
                    $label = trim((string) ($vehicle->current_route ?? ''));
                    if ($label === '') {
                        continue;
                    }

                    $routeId = $routeLookup[$label] ?? null;
                    if ($routeId) {
                        DB::table('fleet_vehicles')
                            ->where('id', $vehicle->id)
                            ->update(['route_id' => $routeId]);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::table('fleet_vehicles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('route_id');
        });
    }
};
