# سایت موجودی املاک و خودرو

بنگاه املاک و نمایشگاه خودرو مهدی نوری. سایت ساده با دو دسته‌بندی (املاک / خودرو)، صفحهٔ آگهی و پنل مدیریت. بدون پایگاه‌داده؛ همه‌چیز در پوشهٔ `data/` ذخیره می‌شود.

## اجرا روی سرور (Ubuntu)

```bash
sudo apt install -y nodejs npm nginx          # Node.js 18 یا بالاتر
sudo git clone https://github.com/alikaidkhordeh/amlak.git /opt/amlak
cd /opt/amlak
sudo npm install --omit=dev                    # فقط برای بهینه‌سازی خودکار عکس‌ها (اختیاری)
sudo cp .env.example .env && sudo nano .env    # رمز مدیریت را بگذارید
sudo chown -R www-data:www-data /opt/amlak

sudo cp deploy/amlak.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now amlak

sudo cp deploy/nginx.conf /etc/nginx/sites-available/amlak   # ساب‌دامین را داخلش بنویسید
sudo ln -s /etc/nginx/sites-available/amlak /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx -d sub.example.com   # HTTPS
```

- پنل مدیریت: `https://ساب‌دامین/admin`
- اگر `ADMIN_PASSWORD` را تنظیم نکنید، رمز در `data/admin-password.txt` ساخته می‌شود.
- بروزرسانی: `cd /opt/amlak && sudo git pull && sudo systemctl restart amlak`
- نسخهٔ پشتیبان: کل پوشهٔ `data/` را کپی کنید (اطلاعات + عکس‌ها و ویدیوها).

## فونت
اگر فایل `Vazirmatn.woff2` را در `public/fonts/` بگذارید، سایت با فونت وزیرمتن نمایش داده می‌شود؛ در غیر این صورت از فونت فارسی خود دستگاه استفاده می‌شود.
