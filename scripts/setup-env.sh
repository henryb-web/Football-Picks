#!/usr/bin/env bash
# Creates .env.example (always) and .env (only if missing) for local development.
# Idempotent: will NOT overwrite an existing .env, so your secrets are safe.
set -euo pipefail
cd "$(dirname "$0")/.."

cat > .env.example <<'EOF'
# Copy this file to .env and fill in values. .env is gitignored.

# Postgres connection (matches docker-compose.yml)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/football_picks?schema=public"

# Auth (milestone 2)
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# External data feeds (milestone 3)
CFBD_API_KEY=""
EOF
echo "wrote .env.example"

if [ -f .env ]; then
  echo ".env already exists — leaving it untouched"
else
  cat > .env <<'EOF'
# Local development environment. This file is gitignored — never commit real secrets.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/football_picks?schema=public"
EOF
  echo "created .env with local DATABASE_URL"
fi
