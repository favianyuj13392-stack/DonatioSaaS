# 🛡️ Guía de Certificación Bancaria ATC y Despliegue en Producción: Donatio SaaS

Este documento contiene la guía operativa y técnica para ejecutar la batería de pruebas de certificación con **ATC Red Enlace (Cybersource)** y realizar el despliegue de **Donatio SaaS** en **Cloudflare Pages** y VPS.

---

## 1. Configuración de Entorno Local / Staging

### 1.1 Levantar Infraestructura en Docker
En la raíz del proyecto (`d:/DEV/SaaSFundacion`):

```bash
# 1. Levantar contenedores (FrankenPHP, PostgreSQL 16, Redis 7)
docker compose up -d

# 2. Ejecutar migraciones con RLS
docker compose exec donatio_api php artisan migrate --force

# 3. Poblar datos iniciales de prueba (Sandbox ATC redenlace_000021)
docker compose exec donatio_api php artisan db:seed --class=FoundationSeeder
```

### 1.2 Iniciar Frontend en Desarrollo
En la carpeta `frontend/`:

```bash
npm install
npm run dev
```
Acceder a: `http://localhost:5173/?tenant=esperanza`

---

## 2. Batería de Pruebas: Matriz ATC 2026

Utilizar las tarjetas de prueba del archivo `tarjetas de prueba 2026.xlsx`:

| Escenario | Número de Tarjeta | Expiración | CVV | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **Visa Frictionless (ECI 05)** | `4000 1234 5678 9010` | `12/28` | `123` | Pago único aprobado directo. ECI 05 guardado en BDD. |
| **Mastercard Frictionless (ECI 02)** | `5100 1234 5678 9010` | `12/28` | `123` | Pago único aprobado directo. ECI 02 guardado en BDD. |
| **Visa StepUp / Challenge** | `4000 0000 0000 0002` | `12/28` | `123` | Abre modal 3DS Cardinal Cruise, solicita OTP `123456` y completa. |
| **Suscripción Mensual TMS** | `4000 1234 5678 9010` | `12/28` | `123` | Genera token TMS, crea registro en `subscriptions` y primer débito. |
| **Donación Anónima** | `4000 1234 5678 9010` | `12/28` | `123` | Marca `is_anonymous = true`, `donor_id = null`. |
| **QR Simple ATC Express** | N/A (Escanear QR) | N/A | N/A | Genera `REF-FNE-{id}`, simula webhook `POST /api/v1/webhooks/qr-payment`. |

### 2.1 Ejecutar Tests Automatizados
```bash
docker compose exec donatio_api php artisan test
```

---

## 3. Despliegue en Producción

### 3.1 Frontend en Cloudflare Pages
1. Conectar el repositorio GitHub en el panel de **Cloudflare Pages**.
2. **Build Settings:**
   * Framework Preset: `Vite`
   * Build command: `npm run build`
   * Build output directory: `dist`
   * Environment Variable: `VITE_API_URL=https://api.donatio.lat/api/v1`
3. **DNS Wildcard:**
   * Agregar registro CNAME en Cloudflare DNS: `*.donatio.lat` apuntando a `donatio-saas.pages.dev`.

### 3.2 Backend en VPS Ubuntu 24.04 con Traefik
1. Clonar el repositorio en el VPS (`/opt/donatio-saas`).
2. Configurar variables de entorno `.env` de producción con credenciales de PostgreSQL y Redis.
3. Iniciar Traefik con certificados SSL Origin de Cloudflare:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
4. Configurar Cronjob del Servidor para el Scheduler diario a las 02:00 AM:
   ```bash
   * * * * * cd /opt/donatio-saas && docker compose exec -T donatio_api php artisan schedule:run >> /dev/null 2>&1
   ```
