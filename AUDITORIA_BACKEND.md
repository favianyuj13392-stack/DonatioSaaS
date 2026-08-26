# 🛡️ Auditoría Técnica Avanzada - Backend & Base de Datos (Donatio SaaS)

**Fecha:** Septiembre 2024
**Rol:** Auditor de Arquitectura y Rendimiento (Escalabilidad & Concurrencia)
**Alcance:** Backend (Laravel 12), Base de Datos (PostgreSQL 16), Integraciones (ATC / Cybersource).

---

## 1. Resumen Ejecutivo
El backend de Donatio SaaS implementa bases excelentes: usa las últimas versiones de Laravel, incorpora **Row Level Security (RLS)** directamente en PostgreSQL para un aislamiento multi-tenant nativo y seguro, e incluye cifrado AES-256 en reposo para credenciales bancarias.

Sin embargo, asumiendo un escenario de "Alto Tráfico" (High Traffic / Concurrency), donde miles de donantes operan simultáneamente o el sistema de cobros recurrentes deba procesar 50,000 tarjetas por noche, **existen cuellos de botella severos, problemas de N+1 ocultos y riesgos de concurrencia** que pueden tumbar el servidor o causar bloqueos (deadlocks) en la pasarela ATC.

A continuación, el análisis de problemas y sus respectivas soluciones estructurales, sin "dibujo libre", orientadas a un producto SaaS B2B2C Enterprise.

---

## 2. Base de Datos & Concurrencia

### 🔴 Hallazgo 2.1: Riesgo de N+1 (Lazy Loading) en Endpoints Críticos
**Problema:** En el `PublicCampaignController`, al consultar los detalles de un tenant (`show`), no se están haciendo *Eager Loadings* explícitos. Si en el futuro se agregan relaciones como `->campaigns`, `->donors`, esto detonará el clásico problema `N+1` en Laravel.
**Solución Arquitectónica:**
- Aplicar `$query->with(['otraRelacion'])` estrictamente.
- Habilitar `Model::preventLazyLoading(!app()->isProduction());` en el `AppServiceProvider` para crashear la app en entorno local si un desarrollador olvida el Eager Loading, garantizando que el código O(N) jamás llegue a producción.

### 🔴 Hallazgo 2.2: Ausencia de Bloqueos de Transacción (Pessimistic Locking) en Cobros QRs
**Problema:** El webhook de Red Enlace (`QrWebhookController`) que actualiza una donación de `pending` a `completed`. Si el banco (por un error de retry) envía 2 webhooks simultáneos al milisegundo para el mismo código QR, podría resultar en inconsistencias.
**Solución Arquitectónica:**
- Implementar Pessimistic Locking: `Donation::where('id', $id)->lockForUpdate()->first();` dentro de una transacción `DB::transaction()`. Esto asegura que el primer request bloquea la fila en Postgres, procesa el estado, y el segundo request encontrará el estado ya procesado y será descartado (Idempotencia en Webhooks).

### 🟡 Hallazgo 2.3: Índices Ausentes para Búsquedas por Tenant
**Problema:** En la migración de la DB (RLS habilitado) están los índices principales (`idx_donations_merchant_ref`, `idx_subscriptions_billing`). Sin embargo, PostgreSQL necesita índices compuestos para el RLS si los queries llevan joins implícitos.
**Solución Arquitectónica:**
- Añadir un índice compuesto: `idx_donations_tenant_status` (`foundation_id`, `status`). En dashboards de Filament, filtrar "Donaciones Completadas" del Tenant será un Seq Scan lento si no tiene este índice compuesto.

---

## 3. Escalabilidad del Procesamiento Asíncrono (Cronjobs vs Colas)

### 🔴 Hallazgo 3.1: Cuello de Botella Masivo en `ProcessRecurringDonationsCommand`
**Problema:** El comando se ejecuta iterando con un `foreach ($subscriptions as $subscription)` y procesando las llamadas síncronas HTTP a Cybersource una por una.
1. **Timeout Total:** Si hay 10,000 suscripciones, a 1 segundo por transacción, el script tomará 2.7 horas en correr, excediendo tiempos de ejecución PHP/Docker.
2. **Rate Limits ATC:** Mandar 10,000 requests continuos a la API de Cybersource desde una sola IP puede detonar un ban por "DDoS behavior".
3. **Fallo de Memoria:** `Subscription::get()` carga todas las filas en RAM a la vez.

**Solución Arquitectónica:**
- **Reemplazar `.get()` por `.chunk(500)` o `.cursor()`.**
- **Migrar a Jobs (Colas Redis):** El CRON diario *solo* debe despachar trabajos en cola: `ProcessSubscriptionJob::dispatch($subscription)->onQueue('billing')`.
- **Throttling/Rate Limiting de Jobs:** Usar `Redis::throttle('atc_billing')->allow(10)->every(1)` para garantizar que los workers (ej. 5 workers `donatio_worker`) jamás superen las 10 transacciones por segundo hacia Cybersource.

---

## 4. Seguridad de Integraciones (APIs y Pasarela)

### 🔴 Hallazgo 4.1: Endpoints Públicos sin Rate Limiting (Ataques de Fuerza Bruta / Carding)
**Problema:** Las rutas POST `/api/v1/donations/checkout` y `/api/v1/donations/3ds-validate` en `api.php` no tienen middleware de Rate Limiting.
Esto es **fatal** en pasarelas de pago. Las mafias de "carding" escriben scripts que envían miles de POST requests a formularios de donación (ya que donar Bs. 5 es perfecto para probar si un lote de 1,000 tarjetas robadas están vivas). Esto subirá la tasa de contracargos del SaaS y Red Enlace cancelará el contrato.
**Solución Arquitectónica:**
- Aplicar middleware de limitación agresiva: `Route::middleware(['throttle:5,1'])`. (Máx 5 intentos de checkout por minuto, por IP).
- Integrar Cloudflare Turnstile, reCAPTCHA Enterprise o ThreatMetrix en el payload del frontend.

### 🟡 Hallazgo 4.2: Acoplamiento de Timeouts
**Problema:** En `AtcSignatureService::request()`, el timeout de Guzzle (Http facade) está hardcodeado a 15 segundos en Prod. Si Cybersource se cae silenciosamente, los workers de Laravel se quedarán colgados esperando, agotando todas las conexiones PHP-FPM disponibles (Caddy colapsará).
**Solución Arquitectónica:**
- Bajar el connect_timeout a 3s y el read_timeout a 10s máximo. Implementar `->retry(2, 100)` nativo de Laravel Http client.

---

## 5. Pruebas y Robustez (Testing)

### 🟡 Hallazgo 5.1: Cobertura Limitada en Fallos Transaccionales
**Problema:** Se verificó la existencia del `RecurringDonationIdempotencyTest`, el cual valida el "camino feliz" con un Mock de Cybersource (`AtcCybersourceAdapter`). No hay evidencia de pruebas de *Race Conditions* o Fallos a nivel de red (`GuzzleException`).
**Solución Arquitectónica:**
- Añadir Tests de Resiliencia: Configurar el mock HTTP para retornar `Http::fake([ '*' => Http::response('Gateway Timeout', 504) ])` y validar que las `Subscriptions` incrementan su contador `failed_attempts_count` correctamente y que la base de datos hace Rollback (`DB::transaction`) sin dejar `donations` huerfanas ni registrar saldos falsos en el `TenantBillingLedger`.

---

## Conclusión Final del Auditor
Laravel es un framework altamente profesional si se configura arquitectónicamente para el escalado. Donatio SaaS tiene un diseño "DDD Lite" (Domain Driven Design) bastante bueno con aislamiento multi-tenant por Base de Datos.

**La prioridad absoluta antes de recibir tráfico pesado comercial (Go-Live) es:**
1. Desacoplar el cobro recurrente del CRON central hacia **Colas de Redis con control de concurrencia y Rate Limits**.
2. **Asegurar los endpoints del Checkout** con Throttling estricto (Anti-Carding).
3. Añadir **Pessimistic Locking** en la confirmación de pagos QR.

Solucionando estos 3 puntos críticos, la plataforma soportará tranquilamente decenas de miles de donantes concurrentes sin degradación del servicio ni inconsistencias financieras.