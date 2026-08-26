<?php

namespace App\Http\Middleware;

use App\Models\Foundation;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    /**
     * Handle an incoming request and bind the active tenant into PostgreSQL RLS and Eloquent.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $subdomain = $this->resolveSubdomain($request);

        if (!$subdomain) {
            return response()->json([
                'error'   => 'TenantNotSpecified',
                'message' => 'No se especificó la fundación o subdominio en la solicitud.',
            ], 400);
        }

        // Buscar el tenant en la base de datos
        $tenant = Foundation::where('subdomain', $subdomain)
            ->orWhere('custom_domain', $request->getHost())
            ->first();

        if (!$tenant) {
            return response()->json([
                'error'   => 'TenantNotFound',
                'message' => 'La fundación solicitada no existe.',
            ], 404);
        }

        // Guardia de Kill Switch: Si la fundación está suspendida por impago o mantenimiento
        if ($tenant->status === 'suspended') {
            return response()->json([
                'error'   => 'TenantSuspended',
                'message' => 'Esta plataforma se encuentra temporalmente suspendida por mantenimiento administrativo.',
                'status'  => 'suspended',
            ], 423);
        }

        if ($tenant->status !== 'active') {
            return response()->json([
                'error'   => 'TenantInactive',
                'message' => 'La fundación no se encuentra activa en este momento.',
                'status'  => $tenant->status,
            ], 403);
        }

        // Registrar el tenant en el contenedor de servicios de Laravel
        app()->instance('current_tenant', $tenant);

        // Si la base de datos es PostgreSQL, inyectar el contexto de sesión RLS
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_tenant_id = '{$tenant->id}'");
        }

        return $next($request);
    }

    /**
     * Resuelve el subdominio a partir de la ruta, cabecera o Hostname.
     */
    protected function resolveSubdomain(Request $request): ?string
    {
        // 1. Parámetro de ruta explícito: /public/tenants/{subdomain}/...
        if ($request->route('subdomain')) {
            return $request->route('subdomain');
        }

        // 2. Cabecera HTTP (útil en llamadas desde Cloudflare Pages o SDK)
        if ($request->hasHeader('X-Tenant-Subdomain')) {
            return $request->header('X-Tenant-Subdomain');
        }

        // 3. Extracción desde Hostname (ej: esperanza.donatio.lat)
        $host = $request->getHost();
        $parts = explode('.', $host);

        // Si tiene al menos 3 partes (subdominio.dominio.tld), tomar la primera
        if (count($parts) >= 3 && $parts[0] !== 'api' && $parts[0] !== 'www') {
            return $parts[0];
        }

        return null;
    }
}
