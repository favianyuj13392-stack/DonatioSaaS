# Resumen Técnico: Qué se hizo y Cómo se hizo

## Arquitectura General
El proyecto **Donatio SaaS** ha sido estructurado como una plataforma multi-tenant (SaaS) robusta para que múltiples Fundaciones (Tenants) puedan captar donaciones de manera aislada utilizando la misma infraestructura.

Se utilizó el patrón de arquitectura **Desacoplada (Headless)**:
- **Backend (API + Backoffice):** Desarrollado en Laravel 12 y Filament v3.
- **Frontend (SPA Pública):** Desarrollado en React 18 con TypeScript y Vite.
- **Infraestructura:** Docker Compose (PostgreSQL 16, Redis 7, Caddy/FrankenPHP), con despliegues orientados a Cloudflare Pages (Frontend) y VPS con Traefik (Backend).

---

## 1. Backend (Laravel / Filament)

### 1.1 Modelo de Datos y Seguridad Multitenant
- **Aislamiento Multi-tenant:** Cada entidad principal (`Campaign`, `Donation`, `Donor`, `Subscription`, `TenantBillingLedger`) está vinculada al modelo central `Foundation` mediante `foundation_id`. Se utiliza el middleware `IdentifyTenant` para determinar dinámicamente el contexto basado en el parámetro `subdomain`.
- **Cifrado Transparente (AES-256):** Las credenciales de integración de cada fundación (API Keys de CyberSource / ATC) se almacenan en base de datos cifradas utilizando la directiva de cast `encrypted` del modelo de Eloquent (`Foundation.php`), asegurando un nivel alto de seguridad (Zero-Knowledge by default para operadores de DB).
- **Consistencia Financiera:** Se diseñó la entidad `TenantBillingLedger` para manejar el libro mayor. Cada donación calcula inmutablemente las tasas (ej. `saas_fee_card`, `atc_fee_qr`) a través del método `calculateSettlement()`, distribuyendo los fondos brutos, las comisiones del banco y la comisión del SaaS de manera auditada.

### 1.2 Integración Bancaria (ATC Red Enlace - CyberSource)
Se desarrolló un sistema de integración avanzado `AtcCybersourceAdapter` compatible con la normativa 2026.
- **Autenticación (Signature Service):** `AtcSignatureService` maneja la firma criptográfica HTTP Signature requerida por la API REST de CyberSource utilizando las credenciales cifradas por tenant.
- **Tokenización (TMS) y 3DS2:**
  - Se implementaron los flujos para `setup3ds`, `check3dsEnrollment` y validación de challenge (`validate3dsChallenge`) para pagos "Frictionless" o "Step-Up".
  - Al completar un pago exitoso, la tarjeta se tokeniza generando un `tms_payment_instrument_id` almacenado en el modelo `Subscription`, para evitar guardar PANs crudos de tarjetas.
- **Pagos QR (AtcQrService):** Orquestación de códigos QR mediante un Webhook (`QrWebhookController`) que actualiza la donación de `pending` a `completed`.

### 1.3 Automatización y Trabajos en Segundo Plano
- **Cobros Recurrentes (MIT):** El comando `ProcessRecurringDonationsCommand` corre diariamente vía cron (02:00 AM). Obtiene todas las suscripciones activas que deben cobrarse en esa fecha y realiza transacciones "Merchant-Initiated" contra el gateway usando los tokens TMS. Incluye candados de concurrencia (`Cache::lock`) para evitar cobros dobles e implementa lógica de reintentos (`failed_attempts_count`).
- **Liquidación Mensual:** El comando `GenerateMonthlyBillingProformasCommand` consolida las donaciones del mes y calcula conversiones de moneda para la facturación entre el SaaS y las ONGs.
- **Backups Resilientes:** Se desarrolló un script en Bash (`r2_daily_backup.sh`) que genera volcados (pg_dump) comprimidos y los sube vía API S3 a **Cloudflare R2** (Zero egress fees), garantizando retención histórica.

---

## 2. Frontend (React)

### 2.1 Enrutamiento y Determinación de Tenant (Context API)
- El punto central es el `TenantContext.tsx`, que funciona como el "Cerebro" del frontend. Evalúa la URL o el subdominio (`resolveSubdomain`) y consulta los endpoints públicos del backend (`/public/tenants/{subdomain}`).
- **Manejo de Estados:** Almacena la configuración visual del tenant (colores, logos), la campaña actual, y el catálogo de otras campañas activas de la misma fundación, manejando un enrutamiento en modo SPA sin recargar la página.

### 2.2 Componentización de Vistas (Landing Page Dinámica)
Se construyó un layout principal (`MainLayout` en `App.tsx`) basado en Zonas dinámicas condicionales:
- **ZONA 1 (Top):** `Navbar` y `HeroSection` (Integran el checkout y la llamada a la acción).
- **ZONA 2 (Contenido):** Secciones condicionales (`AboutSection`, `ProgramsSection`, `ImpactGridSection`, `StoryEditorialSection`) que se renderizan solo si el administrador del tenant llenó los datos en el backoffice (JSON fields).
- **ZONA 3 (Confianza):** `TransparencySection` (desglose de fondos), `InstitutionalResultsSection` (Métricas), `CorporatePartnersMarquee` (Logos de Aliados).
- **Personalización CSS:** La función `applyTenantTheme` inyecta variables CSS root (`--tenant-primary`, `--tenant-primary-hover`) y estilos específicos basados en el payload de la API, logrando un white-label perfecto para cada ONG.

### 2.3 Flujo de Checkout
El checkout (procesamiento de pagos) integra un formulario paso a paso conectándose con las APIs de Laravel. Permite:
- Donaciones Únicas vs Mensuales.
- Pagos con Tarjeta (orquestando el modal Cardinal Cruise 3DS2) o con QR (mostrando dinámicamente la imagen y haciendo *polling* al endpoint `/qr-status`).
- Creación transparente de "Donantes Anónimos" y cálculo predictivo de comisiones en la UI.
