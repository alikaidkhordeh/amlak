# سایت موجودی املاک و خودرو

بنگاه املاک و نمایشگاه خودرو مهدی نوری. سایت نمایشی با دو بخش (املاک / خودرو)، صفحهٔ فهرست با جستجو و مرتب‌سازی، صفحهٔ آگهی و پنل مدیریت. بدون پایگاه‌داده؛ همه‌چیز (آگهی‌ها، عکس‌ها، ویدیوها) در یک پوشهٔ داده ذخیره می‌شود.

- فونت‌ها: استعداد (تیترها) و وزیرمتن (متن) — هر دو آزاد (OFL)، روی خود سایت.
- صفحهٔ اول: عکس‌های واقعی (ویلا/آپارتمان و سورن پلاس/BMW) با حرکت سبک CSS — بدون کتابخانهٔ اضافه.
- هر فیلدی که در پنل خالی بماند (قیمت، آدرس، مشخصات، پرسش‌ها…) در سایت نمایش داده نمی‌شود.
- آگهی‌های نمونه در `seed/demo.json` هستند و **فقط یک بار** در اولین اجرا اضافه می‌شوند (آگهی‌های واقعی دست نمی‌خورند). اگر از پنل حذفشان کنید دوباره برنمی‌گردند.
- منبع عکس‌ها: `public/credits.html`

## نصب روی سرور (Ubuntu) — ساب‌دامین `mehdinoori.enetvip.com`

```bash
sudo git clone https://github.com/alikaidkhordeh/amlak.git /opt/mehdinoori
cd /opt/mehdinoori
sudo bash deploy/install.sh mehdinoori.enetvip.com
```

## بروزرسانی

```bash
cd /opt/mehdinoori && sudo git pull && sudo bash deploy/install.sh mehdinoori.enetvip.com
```

- پنل مدیریت: `/admin`
- لاگ: `sudo journalctl -u mehdinoori -n 50 --no-pager`
- پشتیبان: پوشهٔ `/var/lib/mehdinoori` (اطلاعات + عکس‌ها و ویدیوها)

## اجرای محلی
```bash
node server.js     # http://127.0.0.1:3000  (رمز پنل در data/admin-password.txt)
```
