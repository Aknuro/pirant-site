#!/usr/bin/env bash
# Ежедневная шифрованная копия БД и загрузок. Запуск из cron под пользователем pirant:
#   15 3 * * *  /var/www/pirant/server/deploy/backup-db.sh
# Нужны: /etc/pirant-backup.pass (парольная фраза, права 600) и второе место хранения в Казахстане (BACKUP_TARGET).
set -euo pipefail
set -a; source /var/www/pirant/server/.env; set +a
STAMP=$(date +%F_%H%M)
DIR=${BACKUP_DIR:-/var/backups/pirant}
mkdir -p "$DIR"; umask 077

pg_dump --no-owner "$DATABASE_URL" | gzip | openssl enc -aes-256-cbc -pbkdf2 -salt -pass file:/etc/pirant-backup.pass -out "$DIR/db-$STAMP.sql.gz.enc"
tar -C "$(dirname "${UPLOAD_DIR:-/var/www/pirant/server/uploads}")" -czf - "$(basename "${UPLOAD_DIR:-uploads}")" | openssl enc -aes-256-cbc -pbkdf2 -salt -pass file:/etc/pirant-backup.pass -out "$DIR/uploads-$STAMP.tar.gz.enc"

# копия на второе хранилище (укажите свой сервер/хранилище в Казахстане), например:
# [ -n "${BACKUP_TARGET:-}" ] && rsync -a "$DIR/" "$BACKUP_TARGET"

find "$DIR" -type f -mtime +14 -delete      # храним 14 дней
echo "backup ok: $STAMP"
# Восстановление:
#   openssl enc -d -aes-256-cbc -pbkdf2 -pass file:/etc/pirant-backup.pass -in db-XXXX.sql.gz.enc | gunzip | psql "$DATABASE_URL"
