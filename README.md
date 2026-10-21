# سایت موجودی املاک و خودرو

بنگاه املاک و نمایشگاه خودرو مهدی نوری. سایت ساده با دو دسته‌بندی (املاک / خودرو)، صفحهٔ آگهی و پنل مدیریت. بدون پایگاه‌داده؛ همه‌چیز (آگهی‌ها، عکس‌ها، ویدیوها) در یک پوشهٔ داده ذخیره می‌شود. فونت: شریف.

## نصب روی سرور (Ubuntu) — ساب‌دامین `mehdinoori.enetvip.com`

۱. رکورد DNS: یک رکورد `A` برای `mehdinoori` بسازید که به IP سرور اشاره کند.

۲. روی سرور:

```bash
sudo git clone https://github.com/alikaidkhordeh/amlak.git /opt/mehdinoori
cd /opt/mehdinoori
sudo bash deploy/install.sh mehdinoori.enetvip.com
```

اسکریپت خودکار Node.js و nginx را نصب می‌کند، یک پورت آزاد برمی‌دارد (با سرویس‌های دیگر سرور قاطی نمی‌شود)، سرویس `mehdinoori` را می‌سازد، nginx را برای ساب‌دامین تنظیم می‌کند و HTTPS می‌گیرد. در پایان آدرس سایت و رمز پنل را چاپ می‌کند.

- پنل مدیریت: `https://mehdinoori.enetvip.com/admin`
- بروزرسانی: `cd /opt/mehdinoori && sudo git pull && sudo bash deploy/install.sh mehdinoori.enetvip.com`
- لاگ: `sudo journalctl -u mehdinoori -n 50 --no-pager`
- پشتیبان: پوشهٔ `/var/lib/mehdinoori` (اطلاعات + عکس‌ها و ویدیوها)

## اجرای محلی
```bash
node server.js     # http://127.0.0.1:3000  (رمز پنل در data/admin-password.txt)
```
