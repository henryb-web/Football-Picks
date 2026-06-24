#!/usr/bin/env bash
# Appends AUTH_SECRET to .env if it isn't already set. Idempotent and safe.
set -euo pipefail
cd "$(dirname "$0")/.."

ENVFILE=".env"
[ -f "$ENVFILE" ] || { echo "no $ENVFILE found — run scripts/setup-env.sh first"; exit 1; }

if grep -q '^AUTH_SECRET=' "$ENVFILE" && [ -n "$(grep '^AUTH_SECRET=' "$ENVFILE" | cut -d= -f2- | tr -d '\"')" ]; then
  echo "AUTH_SECRET already set — leaving it untouched"
else
  SECRET="$(openssl rand -base64 33)"
  # remove any empty AUTH_SECRET line, then append a real one
  grep -v '^AUTH_SECRET=' "$ENVFILE" > "$ENVFILE.tmp" || true
  mv "$ENVFILE.tmp" "$ENVFILE"
  printf 'AUTH_SECRET="%s"\n' "$SECRET" >> "$ENVFILE"
  echo "generated and wrote AUTH_SECRET"
fi
