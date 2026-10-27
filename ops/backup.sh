#!/bin/sh
set -eu
cd /opt/f-software-hub
docker compose --env-file release.env exec -T -e BACKUP_DIR=/app/backups app node --import tsx scripts/backup.ts
