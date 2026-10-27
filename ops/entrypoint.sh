#!/bin/sh
set -eu
if [ -r /run/secrets/admin_initial_password ]; then
  ADMIN_INITIAL_PASSWORD="$(cat /run/secrets/admin_initial_password)"
  export ADMIN_INITIAL_PASSWORD
fi
export SEED_FILE=/app/seed-data/catalog.json
node --import tsx scripts/init-db.ts
unset ADMIN_INITIAL_PASSWORD
exec node server.js
