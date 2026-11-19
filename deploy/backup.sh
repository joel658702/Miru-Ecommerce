#!/bin/bash
# Respaldo lógico de la base (pg_dump) con retención de 7 días.
#
# Requiere DATABASE_URL en /opt/miru/deploy/.env.backup (chmod 600), con la
# cadena de conexión de Supabase:
#   postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
# Se obtiene en Supabase → Settings → Database → Connection string.
set -euo pipefail

ENV_FILE="/opt/miru/deploy/.env.backup"
DIR="/opt/miru/backups"
RETENTION_DAYS=7

if [ ! -f "$ENV_FILE" ]; then
  echo "falta $ENV_FILE (ver comentario del script)"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL vacío"
  exit 1
fi

mkdir -p "$DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$DIR/miru-$STAMP.sql.gz"

pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$FILE"
echo "$(date -Is) backup $FILE ($(du -h "$FILE" | cut -f1))"

find "$DIR" -name 'miru-*.sql.gz' -mtime +$RETENTION_DAYS -delete
