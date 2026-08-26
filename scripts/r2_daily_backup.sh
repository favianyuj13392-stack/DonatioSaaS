#!/bin/bash

# ==============================================================================
# Donatio SaaS & Fundación Nuestra Esperanza - Automated Cloudflare R2 Daily Backup
# Retención de 10 Años (Norma Red Enlace / ASFI Ley 393) | 100% Gratuito (Cloudflare R2 Free Tier 10GB)
# ==============================================================================

set -e

# Configuración de variables (Inyectadas vía .env)
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE_DAY=$(date +"%Y-%m-%d")
BACKUP_DIR="/tmp"
BACKUP_FILE="${BACKUP_DIR}/donatio_db_backup_${TIMESTAMP}.sql.gz"
R2_BUCKET=${CLOUDFLARE_R2_BUCKET:-"donatio-backups"}

echo "[$(date)] 🚀 Iniciando backup diario comprimido de PostgreSQL..."

# 1. Generar volcado comprimido directo sin consumo de disco persistente
docker exec -i donatio_postgres pg_dump -U ${DB_USERNAME:-postgres} ${DB_DATABASE:-donatio_saas} | gzip -9 > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] ✓ Backup generado exitosamente en /tmp: ${BACKUP_FILE} (Tamaño: ${FILE_SIZE})"

# 2. Subida a Cloudflare R2 vía AWS CLI / S3 Compatible API
echo "[$(date)] ☁️ Subiendo backup a Cloudflare R2 Bucket: ${R2_BUCKET}..."

# Nota: Cloudflare R2 usa la API compatible con S3
# Se configura endpoint: https://<account_id>.r2.cloudflarestorage.com
aws --endpoint-url "${CLOUDFLARE_R2_ENDPOINT}" s3 cp "${BACKUP_FILE}" "s3://${R2_BUCKET}/${DATE_DAY}/donatio_db_backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] ✓ Subida a Cloudflare R2 completada con éxito."

# 3. Borrado del archivo temporal local para GARANTIZAR 0% de saturación en disco del VPS
rm -f "${BACKUP_FILE}"
echo "[$(date)] 🧹 Archivo temporal /tmp eliminado. Espacio en disco del servidor liberado."

echo "[$(date)] 🎉 Proceso de Backup Diario a Cloudflare R2 finalizado con éxito."
