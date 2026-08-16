#!/usr/bin/env bash
# MoonVerse Cloud Agent start phase.
# Per-boot reconciliation: bring up PostgreSQL, provision the database, apply
# migrations, and seed demo data once. Safe to run on every boot.
set -euo pipefail

cd "$(dirname "$0")/.."

# Start the PostgreSQL 16 cluster (no-op if already running).
sudo pg_ctlcluster 16 main start || true

# Wait for the server to accept connections.
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then
    break
  fi
  sleep 1
done

# Provision the application role and database if they do not exist.
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='moonverse'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE moonverse LOGIN PASSWORD 'moonverse';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='moonverse'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE moonverse OWNER moonverse;"

# Apply committed migrations (idempotent).
npm run prisma:migrate:deploy

# Seed demo data only when the database has no users, so existing data is never
# wiped on later boots.
USER_COUNT=$(PGPASSWORD=moonverse psql -h localhost -U moonverse -d moonverse -tAc \
  'SELECT COUNT(*) FROM "users";' 2>/dev/null | tr -d '[:space:]' || echo 0)
if [ "${USER_COUNT:-0}" = "0" ]; then
  npm run prisma:seed
fi

echo "MoonVerse database is ready."
