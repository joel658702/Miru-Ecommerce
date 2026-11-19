#!/bin/bash
# Mantiene despierto el proyecto Free de Supabase (se pausa tras ~7 días sin uso).
set -euo pipefail

ENV_FILE="/opt/miru/deploy/.env.prod"
if [ ! -f "$ENV_FILE" ]; then
  echo "falta $ENV_FILE"
  exit 1
fi

SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SERVICE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

STATUS=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/tenants?select=id&limit=1")

echo "$(date -Is) keepalive status=$STATUS"
[ "$STATUS" = "200" ]
