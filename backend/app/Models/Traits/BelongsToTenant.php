<?php

namespace App\Models\Traits;

use App\Models\Foundation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    /**
     * Boot the BelongsToTenant trait.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Auto-asignar foundation_id al crear nuevos registros
        static::creating(function (Model $model) {
            if (empty($model->foundation_id) && app()->bound('current_tenant')) {
                $tenant = app('current_tenant');
                if ($tenant instanceof Foundation) {
                    $model->foundation_id = $tenant->id;
                }
            }
        });

        // Scope global a nivel Eloquent (Doble capa de seguridad junto con PostgreSQL RLS)
        static::addGlobalScope('tenant_isolation', function (Builder $builder) {
            if (app()->bound('current_tenant')) {
                $tenant = app('current_tenant');
                if ($tenant instanceof Foundation) {
                    $builder->where($builder->getModel()->getTable() . '.foundation_id', $tenant->id);
                }
            }
        });
    }

    /**
     * Relación con la Fundación / Tenant.
     */
    public function foundation(): BelongsTo
    {
        return $this->belongsTo(Foundation::class);
    }
}
