#!/usr/bin/env bash
# MoonVerse Cloud Agent install phase.
# Idempotent bootstrap that runs after the repository is checked out.
set -euo pipefail

cd "$(dirname "$0")/.."

# Ensure a local PostgreSQL server is available. MoonVerse uses Postgres via
# Prisma; the default Cloud Agent image does not ship it, so install it once.
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

# Install JS dependencies from the lockfile. The `postinstall` script runs
# `prisma generate`, so the Prisma Client is produced here.
npm ci

# Create a local development .env if one does not already exist. Secrets stay on
# the machine (this file is gitignored) and point at the in-VM PostgreSQL.
if [ ! -f .env ]; then
  cat > .env <<EOF
DATABASE_URL="postgresql://moonverse:moonverse@localhost:5432/moonverse?schema=public"
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
EOF
  echo "Created .env for local development."
fi
