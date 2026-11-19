#!/bin/bash
# Comprueba panel y API; deja una línea por ejecución y falla si algo no responde.
set -uo pipefail

PANEL=$(curl -s -o /dev/null -m 15 -w '%{http_code}' https://miruecommerce.pro/login)
API_BODY=$(curl -s -m 15 https://api.miruecommerce.pro/health || true)

if [ "$API_BODY" = '{"ok":true}' ]; then
  API="ok"
else
  API="down"
fi

echo "$(date -Is) panel=$PANEL api=$API"

if [ "$PANEL" != "200" ] || [ "$API" != "ok" ]; then
  exit 1
fi
