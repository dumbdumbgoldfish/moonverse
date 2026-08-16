#!/usr/bin/env bash
# MoonVerse Cloud Agent install phase.
# Idempotent, source-derived setup that runs after the repository is checked out.
set -euo pipefail

cd "$(dirname "$0")/.."

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
