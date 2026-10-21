#!/usr/bin/env bash
# نصب / بروزرسانی سایت روی Ubuntu — چند بار اجرا کردنش بی‌خطر است.
# استفاده:  sudo bash deploy/install.sh mehdinoori.enetvip.com
set -euo pipefail

DOMAIN="${1:-mehdinoori.enetvip.com}"
NAME="mehdinoori"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="/var/lib/${NAME}"
ENV_FILE="${APP_DIR}/.env"

[ "$(id -u)" = 0 ] || { echo "این اسکریپت را با sudo اجرا کنید."; exit 1; }
export DEBIAN_FRONTEND=noninteractive

echo "==> ۱) نصب Node.js و nginx"
node_ok=0
if command -v node >/dev/null 2>&1; then
  [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] && node_ok=1
fi
if [ "$node_ok" = 0 ]; then
  apt-get update -y
  apt-get install -y curl ca-certificates
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
command -v nginx >/dev/null 2>&1 || { apt-get update -y; apt-get install -y nginx; }

echo "==> ۲) انتخاب پورت آزاد (این سایت با سرویس‌های دیگر سرور قاطی نمی‌شود)"
current_port=""
[ -f "$ENV_FILE" ] && current_port="$(grep -E '^PORT=' "$ENV_FILE" | head -1 | cut -d= -f2 || true)"
if [ -n "$current_port" ]; then
  PORT="$current_port"
else
  PORT=3107
  while ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${PORT}$"; do PORT=$((PORT + 1)); done
fi
echo "    پورت داخلی: ${PORT}"

echo "==> ۳) تنظیمات (.env) و پوشهٔ داده"
mkdir -p "$DATA_DIR"
if [ ! -f "$ENV_FILE" ]; then
  PASS="$(openssl rand -hex 6)"
  cat > "$ENV_FILE" <<EOF
PORT=${PORT}
HOST=127.0.0.1
ADMIN_PASSWORD=${PASS}
DATA_DIR=${DATA_DIR}
EOF
  NEW_PASS="$PASS"
fi
chown root:www-data "$ENV_FILE"; chmod 640 "$ENV_FILE"
chown -R www-data:www-data "$DATA_DIR"; chmod 750 "$DATA_DIR"

echo "==> ۴) نصب وابستگی اختیاری (بهینه‌سازی خودکار عکس‌ها)"
( cd "$APP_DIR" && npm install --omit=dev --no-audit --no-fund ) \
  || echo "    هشدار: نصب sharp انجام نشد؛ سایت بدون آن هم کار می‌کند."
chmod -R a+rX "$APP_DIR"

echo "==> ۵) سرویس systemd"
cat > "/etc/systemd/system/${NAME}.service" <<EOF
[Unit]
Description=Mehdi Noori real estate and cars website
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
EnvironmentFile=${ENV_FILE}
Environment=NODE_ENV=production
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=3
User=www-data
Group=www-data
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "${NAME}" >/dev/null 2>&1
systemctl restart "${NAME}"

echo "==> ۶) nginx برای ${DOMAIN}"
cat > "/etc/nginx/conf.d/${NAME}.conf" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    client_max_body_size 300m;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_request_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOF
nginx -t
systemctl reload nginx

echo "==> ۷) بررسی اجرای سرویس"
sleep 2
if curl -fsS "http://127.0.0.1:${PORT}/api/settings" >/dev/null; then
  echo "    سرویس بالا است."
else
  echo "    خطا: سرویس بالا نیامد. لاگ:  journalctl -u ${NAME} -n 50 --no-pager"; exit 1
fi

echo "==> ۸) گواهی HTTPS (اگر DNS ساب‌دامین به این سرور رسیده باشد)"
if command -v certbot >/dev/null 2>&1 || apt-get install -y certbot python3-certbot-nginx >/dev/null 2>&1; then
  if certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
    SCHEME=https
  else
    SCHEME=http
    echo "    HTTPS فعال نشد (احتمالاً DNS هنوز به این سرور اشاره نمی‌کند). بعداً این را بزنید:"
    echo "    sudo certbot --nginx -d ${DOMAIN} --redirect"
  fi
else
  SCHEME=http
fi

echo
echo "=============================================================="
echo " سایت:        ${SCHEME}://${DOMAIN}"
echo " پنل مدیریت:  ${SCHEME}://${DOMAIN}/admin"
if [ -n "${NEW_PASS:-}" ]; then
  echo " رمز پنل:     ${NEW_PASS}   (داخل ${ENV_FILE} هم هست)"
else
  echo " رمز پنل:     همان رمز قبلی داخل ${ENV_FILE}"
fi
echo " داده‌ها:      ${DATA_DIR}  (برای پشتیبان‌گیری این پوشه را کپی کنید)"
echo "=============================================================="
