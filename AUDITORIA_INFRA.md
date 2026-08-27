# 🛡️ Auditoría Técnica Avanzada - Infraestructura y DevOps (Donatio SaaS)

**Fecha:** Septiembre 2024
**Rol:** Auditor de Infraestructura, DevOps y Despliegue
**Alcance:** Orquestación Docker, FrankenPHP, Bases de Datos, Manejo de Volúmenes, Configuración de Backups y Seguridad.

---

## 1. Resumen Ejecutivo
La infraestructura de Donatio SaaS apuesta por una pila tecnológica vanguardista y altamente performante: **FrankenPHP (construido en Go)** como servidor de aplicaciones que reemplaza el stack tradicional de Nginx+PHP-FPM, **PostgreSQL 16** como motor relacional primario y **Redis 7** para colas y caché.

A nivel de despliegue, la configuración en `docker-compose.yml` es sólida para un entorno VPS, utilizando contenedores aislados. Además, el script de backups automáticos hacia Cloudflare R2 resuelve de forma elegante e inteligente el problema del costo de almacenamiento prolongado (requisito de la Ley 393).

Sin embargo, desde la perspectiva de un auditor de sistemas de grado bancario / alta disponibilidad, he identificado ciertas vulnerabilidades, cuellos de botella de I/O y riesgos de seguridad que deben mitigarse antes del Go-Live.

---

## 2. Orquestación y Contenedores (Docker & FrankenPHP)

### 🔴 Hallazgo 2.1: Riesgo de Seguridad por Exposición de Puertos en Bases de Datos
**Problema:** En el archivo `docker-compose.yml`, los servicios de base de datos exponen sus puertos directamente al host físico.
```yaml
  donatio_postgres:
    ports:
      - "5433:5432" # Expuesto al exterior
  donatio_redis:
    ports:
      - "6379:6379" # Expuesto al exterior
```
Si el VPS no tiene un firewall estricto configurado a nivel de sistema operativo (UFW/Iptables), cualquier atacante en internet puede intentar ataques de fuerza bruta contra Postgres o, peor aún, enviar comandos destructivos a Redis (que por defecto no tiene contraseña en este archivo).
**Solución Arquitectónica:**
- **Eliminar** la directiva `ports` de los servicios `donatio_postgres` y `donatio_redis`. Estos servicios solo deben comunicarse internamente con la API a través de la red de Docker (`donatio_net`). Si se necesita acceso por consola para debugging, usar `docker exec -it` o establecer un túnel SSH.

### 🟡 Hallazgo 2.2: Contraseña de Redis Ausente
**Problema:** El contenedor de Redis se levanta sin contraseña, y Laravel (`config/database.php`) también espera una conexión abierta. Aunque se cierre el puerto externo, un atacante que logre ejecutar código arbitrario (RCE) en la API tendrá acceso root inmediato al almacén de caché y colas.
**Solución Arquitectónica:**
- Modificar el inicio de Redis en el `docker-compose.yml` para exigir contraseña: `command: redis-server --requirepass ${REDIS_PASSWORD}`.
- Reflejar este cambio en el archivo `.env` de Laravel.

### 🟢 Acierto Destacado: FrankenPHP y OPcache
El uso de `dunglas/frankenphp:php8.3-alpine` y la configuración de `php.ini` (`opcache.enable = 1`, `opcache.memory_consumption = 256`) es brillante. Al compilar el framework en memoria, se reduce el I/O de disco dramáticamente.

---

## 3. Resiliencia de Volúmenes y Persistencia de Datos

### 🔴 Hallazgo 3.1: Volúmenes Anónimos Locales (Single Point of Failure)
**Problema:** El `docker-compose.yml` define volúmenes nombrados locales (`pgdata:`, `redisdata:`). En un entorno de producción, si el disco físico del VPS falla, la base de datos se pierde instantáneamente.
Esto impide escalar el sistema horizontalmente (Docker Swarm o Kubernetes), ya que los datos están atados al host físico.
**Solución Arquitectónica:**
- Si bien para un despliegue VPS único es aceptable, es crucial garantizar que la retención de los *Snapshots* a nivel de proveedor de Cloud (ej. AWS EBS, DigitalOcean Volumes) sea diaria y automatizada, como complemento al backup de base de datos.

### 🟡 Hallazgo 3.2: Redis sin Persistencia (AOF) Activada
**Problema:** El contenedor de Redis se levanta con la configuración por defecto de Alpine, la cual guarda "snapshots" esporádicos (RDB). Si el contenedor de Redis se reinicia bruscamente, los *Jobs* de facturación de tarjetas que estaban en la cola y aún no se habían procesado se perderán en el limbo.
**Solución Arquitectónica:**
- Activar el "Append Only File" en Redis para garantizar que cada job encolado se guarde en disco al instante: `command: redis-server --appendonly yes`.

---

## 4. Estrategia de Backups y Retención

### 🟢 Acierto Destacado: Script Bash `r2_daily_backup.sh`
- La lógica de hacer el *dump* a `/tmp` (memoria RAM o disco temporal volátil) sin comprometer el almacenamiento del VPS es una excelente práctica.
- Utilizar Cloudflare R2 con la API compatible de AWS S3 (`aws s3 cp`) es ideal financieramente porque R2 no cobra tarifas de salida (Egress Fees), lo cual es crítico cuando se suben backups pesados diariamente durante 10 años.

### 🟡 Hallazgo 4.1: Falta de Encriptación Asimétrica en el Backup
**Problema:** El volcado generado (`pg_dump | gzip`) se sube en texto plano (comprimido) a Cloudflare R2. Si las credenciales de S3 se filtran o alguien compromete el Bucket en Cloudflare, todo el historial de donaciones e información de los usuarios (aunque las credenciales bancarias de la ONG estén cifradas AES) queda expuesto (Data Breach).
**Solución Arquitectónica:**
- Implementar GPG para cifrar el archivo comprimido antes de subirlo: `pg_dump ... | gzip -9 | gpg --encrypt --recipient admin@donatio.lat > backup.sql.gz.gpg`. De esta forma, el archivo en la nube es inútil sin la llave privada física del administrador.

---

## Conclusión Final del Auditor
La capa de infraestructura y DevOps de Donatio SaaS refleja decisiones técnicas muy modernas. FrankenPHP es el futuro del despliegue en PHP, y Cloudflare R2 es la opción más económica para cumplir las normativas bancarias.

**Para asegurar la certificación y garantizar la disponibilidad:**
1. **Cortar la exposición pública:** Eliminar inmediatamente el mapeo de puertos de Postgres (`5433:5432`) y Redis (`6379:6379`).
2. **Robustecer las colas:** Activar AOF en Redis para no perder transacciones de tarjetas en caso de un reinicio.
3. **Cifrar Backups:** Encriptar los volcados (GPG) antes de enviarlos al almacenamiento en la nube, mitigando riesgos de filtración masiva de datos (Data Breach).