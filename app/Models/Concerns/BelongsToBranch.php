<?php

namespace App\Models\Concerns;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToBranch
{
    public static function bootBelongsToBranch(): void
    {
        static::creating(function ($model): void {
            if (!empty($model->branch_id)) {
                return;
            }

            $user = auth()->user();
            if ($user?->branch_id) {
                $model->branch_id = (int) $user->branch_id;
                return;
            }

            $model->branch_id = Branch::resolveDefaultId();
        });

        static::addGlobalScope('branch', function (Builder $builder): void {
            $user = auth()->user();

            if ($user === null || $user->isAdmin()) {
                return;
            }

            $table = $builder->getModel()->getTable();
            $builder->where("{$table}.branch_id", (int) $user->branch_id);
        });
    }

    public function scopeForBranch(Builder $query, int $branchId): Builder
    {
        return $query->withoutGlobalScope('branch')
            ->where($this->getTable() . '.branch_id', $branchId);
    }

    public function scopeWithoutBranchScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('branch');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
