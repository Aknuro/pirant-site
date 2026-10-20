# Развёртывание на VDS (Ubuntu 22.04/24.04)

Ниже команды для чистого сервера. Выполняются под пользователем с `sudo`.

## 1. Пакеты

```bash
sudo apt update && sudo apt install -y postgresql nginx certbot python3-certbot-nginx git ufw
# Node.js 20+ (например, через NodeSource или nvm); проверьте: node -v
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable   # порты 5432 и 3001 наружу НЕ открываем
```

## 2. База данных

```bash
sudo -u postgres psql -c "CREATE USER pirant WITH PASSWORD 'НАДЁЖНЫЙ_ПАРОЛЬ';"
sudo -u postgres psql -c "CREATE DATABASE pirant OWNER pirant;"
```
PostgreSQL слушает только localhost (так по умолчанию в Ubuntu) — оставьте как есть.

## 3. Код

```bash
sudo useradd -r -m -d /var/www/pirant -s /usr/sbin/nologin pirant   # если ещё нет
# скопируйте проект в /var/www/pirant (git clone или scp), затем:
sudo chown -R pirant:pirant /var/www/pirant
cd /var/www/pirant && sudo -u pirant npm ci && sudo -u pirant npm run build        # фронтенд → dist/
cd server && sudo -u pirant npm ci
sudo -u pirant cp .env.example .env && sudo -u pirant nano .env
```
В `.env`: `NODE_ENV=production`, `PUBLIC_URL=https://pirant.kz`, `DATABASE_URL`, `JWT_SECRET` и `APP_ENC_KEY` (`openssl rand -hex 32`, разные), `ADMIN_PASSWORD`, `SMTP_*`, `NOTIFY_EMAILS`, `TELEGRAM_BOT_TOKEN`. Права: `chmod 600 .env`.

```bash
sudo -u pirant npm run migrate && sudo -u pirant npm run seed && sudo -u pirant npm run create-admin
sudo -u pirant nano .env     # после create-admin удалите строку ADMIN_PASSWORD
```
**APP_ENC_KEY нельзя терять и менять:** им зашифрованы секреты 2FA; без него все пользователи потеряют доступ к кодам.

## 4. Сервис

```bash
sudo cp deploy/pirant-server.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now pirant-server
sudo systemctl status pirant-server        # логи: journalctl -u pirant-server -f
```

## 5. nginx и HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/pirant.kz
sudo ln -s /etc/nginx/sites-available/pirant.kz /etc/nginx/sites-enabled/
# на время выпуска сертификата закомментируйте блок 443 или используйте: sudo certbot --nginx -d pirant.kz -d www.pirant.kz
sudo nginx -t && sudo systemctl reload nginx
```
Домен должен указывать на IP сервера (A-запись).

## 6. Резервные копии

```bash
sudo sh -c 'openssl rand -base64 32 > /etc/pirant-backup.pass && chmod 600 /etc/pirant-backup.pass && chown pirant /etc/pirant-backup.pass'
sudo -u pirant crontab -e      # добавить:  15 3 * * *  /var/www/pirant/server/deploy/backup-db.sh
```
Парольную фразу и `APP_ENC_KEY` сохраните отдельно от сервера. В `backup-db.sh` включите копирование на второе хранилище в Казахстане. Раз в квартал проверяйте восстановление.

## 7. Обновление

```bash
cd /var/www/pirant && sudo -u pirant git pull && sudo -u pirant npm ci && sudo -u pirant npm run build
cd server && sudo -u pirant npm ci && sudo -u pirant npm run migrate && sudo systemctl restart pirant-server
```

## Чек-лист безопасности

- Админка открывается только по HTTPS; `NODE_ENV=production` включает защищённые cookie.
- 2FA включена у всех (`REQUIRE_2FA=true`). Потерян телефон и резервные коды → суперадмин сбрасывает 2FA в «Пользователи».
- Если потерян доступ у единственного суперадмина: на сервере `ADMIN_PASSWORD=... npm run create-admin` сменит пароль; 2FA сбросьте в БД: `UPDATE users SET totp_enabled=false, totp_secret_enc=null WHERE login='admin';`
- Токен Telegram-бота и SMTP-пароль хранятся только в `server/.env`.
