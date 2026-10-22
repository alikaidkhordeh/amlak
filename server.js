'use strict';
/**
 * سایت موجودی املاک و خودرو — سرور بدون وابستگی (فقط Node.js 18+)
 * اجرا:  node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------- بارگذاری .env (اختیاری) ----------
try {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch (_) { /* ignore */ }

// sharp اختیاری است؛ اگر نصب باشد عکس‌ها خودکار بهینه و کم‌حجم می‌شوند
let sharp = null;
try { sharp = require('sharp'); } catch (_) { /* optional */ }

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const UP = path.join(DATA, 'uploads');
const PUB = path.join(__dirname, 'public');
const MAX_UPLOAD = 300 * 1024 * 1024; // 300MB
fs.mkdirSync(UP, { recursive: true });

// ---------- رمز مدیر و کلید نشست ----------
function readOrCreate(file, make) {
  try { return fs.readFileSync(file, 'utf8').trim(); } catch (_) {
    const v = make();
    fs.writeFileSync(file, v + '\n', { mode: 0o600 });
    return v;
  }
}
const SECRET = process.env.SESSION_SECRET || readOrCreate(path.join(DATA, '.secret'), () => crypto.randomBytes(32).toString('hex'));
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = readOrCreate(path.join(DATA, 'admin-password.txt'), () => crypto.randomBytes(6).toString('hex'));
  console.log('رمز ورود به پنل مدیریت در این فایل است: ' + path.join(DATA, 'admin-password.txt'));
}

// ---------- پایگاه داده (فایل JSON) ----------
const DB_FILE = path.join(DATA, 'db.json');
const DEFAULT_SETTINGS = {
  siteName: 'بنگاه املاک و نمایشگاه خودرو مهدی نوری',
  tagline: 'خرید و فروش ملک و خودرو',
  phone: '',
  whatsapp: '',
  instagram: '',
  currency: 'تومان',
  covers: { property: '', car: '' },
  templates: {
    property: {
      fields: ['نوع ملک', 'متراژ', 'تعداد اتاق', 'سال ساخت', 'طبقه', 'سند', 'پارکینگ', 'انباری', 'آسانسور'],
      questions: ['وضعیت سند چیست؟', 'قابل معاوضه است؟', 'امکان دریافت وام دارد؟', 'زمان بازدید چه موقع است؟']
    },
    car: {
      fields: ['نوع خودرو', 'سال ساخت', 'کارکرد', 'رنگ', 'نوع سوخت', 'گیربکس', 'وضعیت بدنه', 'بیمه شخص ثالث', 'شهر پلاک'],
      questions: ['رنگ‌شدگی دارد؟', 'تصادفی بوده است؟', 'قابل معاوضه است؟', 'شرایط پرداخت چگونه است؟']
    }
  }
};
let db = { settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), listings: [], meta: {} };
try {
  const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  db.listings = Array.isArray(raw.listings) ? raw.listings : [];
  db.meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
  db.settings = Object.assign({}, DEFAULT_SETTINGS, raw.settings || {});
  db.settings.covers = Object.assign({}, DEFAULT_SETTINGS.covers, (raw.settings || {}).covers || {});
  db.settings.templates = Object.assign({}, DEFAULT_SETTINGS.templates, (raw.settings || {}).templates || {});
} catch (_) { /* first run */ }

let saving = false, dirty = false;
function save() {
  if (saving) { dirty = true; return; }
  saving = true;
  const tmp = DB_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify(db), (err) => {
    if (!err) fs.renameSync(tmp, DB_FILE);
    saving = false;
    if (dirty) { dirty = false; save(); }
  });
}
function saveSync() { fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db)); fs.renameSync(DB_FILE + '.tmp', DB_FILE); }

// ---------- ابزارها ----------
const CATS = ['property', 'car'];
const EXT_TYPE = { '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.webp': 'image', '.gif': 'image', '.mp4': 'video', '.webm': 'video', '.mov': 'video', '.m4v': 'video' };
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.txt': 'text/plain; charset=utf-8'
};

const str = (v, max = 2000) => String(v == null ? '' : v).trim().slice(0, max);
const faDigits = (s) => String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
function cleanPrice(v) {
  let s = faDigits(str(v, 60)).replace(/[,٬،\s]/g, '');
  return /^\d+$/.test(s) ? s : str(v, 60);
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const newId = () => crypto.randomBytes(4).toString('hex');

function cleanMedia(arr) {
  const out = [], seen = new Set();
  for (const m of Array.isArray(arr) ? arr : []) {
    const mm = /^\/uploads\/([a-f0-9]{16}\.[a-z0-9]{2,5})$/.exec(String(m && m.url || ''));
    if (!mm || seen.has(mm[1])) continue;
    const type = EXT_TYPE[path.extname(mm[1])];
    if (!type || !fs.existsSync(path.join(UP, mm[1]))) continue;
    seen.add(mm[1]);
    out.push({ type, url: '/uploads/' + mm[1] });
  }
  return out;
}
function cleanRows(arr, a, b, ma, mb) {
  return (Array.isArray(arr) ? arr : [])
    .map((r) => ({ [a]: str(r && r[a], ma), [b]: str(r && r[b], mb) }))
    .filter((r) => r[a] && r[b]);
}
function cleanListing(body, existing) {
  const category = CATS.includes(body.category) ? body.category : (existing && existing.category);
  const title = str(body.title, 160);
  if (!category) return { error: 'دسته‌بندی را انتخاب کنید' };
  if (!title) return { error: 'عنوان را وارد کنید' };
  return {
    value: {
      id: existing ? existing.id : newId(),
      category,
      title,
      price: cleanPrice(body.price),
      address: str(body.address, 300),
      description: str(body.description, 5000),
      fields: cleanRows(body.fields, 'label', 'value', 60, 300),
      qa: cleanRows(body.qa, 'q', 'a', 200, 1500),
      media: cleanMedia(body.media),
      published: body.published !== false,
      sold: body.sold === true,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
}
function unlinkUpload(url) {
  const mm = /^\/uploads\/([a-f0-9]{16}\.[a-z0-9]{2,5})$/.exec(String(url || ''));
  if (mm) fs.unlink(path.join(UP, mm[1]), () => {});
}
// خلاصهٔ کارت: نوع (ویلایی/آپارتمان، ایرانی/خارجی) و حداکثر سه مشخصهٔ کلیدی — فقط اگر پر شده باشند
const KIND_LABEL = { property: 'نوع ملک', car: 'نوع خودرو' };
const KEY_SPECS = { property: ['متراژ', 'تعداد اتاق', 'سال ساخت'], car: ['سال ساخت', 'کارکرد', 'گیربکس'] };
function keySpecs(l) {
  const get = (label) => ((l.fields || []).find((f) => f.label === label) || {}).value || '';
  return KEY_SPECS[l.category].map((label) => {
    let v = get(label);
    if (!v) return null;
    if (/^[\d۰-۹]+$/.test(v)) {
      if (label === 'تعداد اتاق') v += ' خواب';
      else if (label === 'سال ساخت') v = (l.category === 'car' ? 'مدل ' : 'ساخت ') + v;
      else if (label === 'متراژ') v += ' متر';
    }
    return { label, value: v };
  }).filter(Boolean);
}
function summary(l) {
  const firstImg = (l.media || []).find((m) => m.type === 'image');
  const kind = ((l.fields || []).find((f) => f.label === KIND_LABEL[l.category]) || {}).value || '';
  return {
    id: l.id, category: l.category, title: l.title, price: l.price, kind, specs: keySpecs(l),
    address: l.address ? l.address.slice(0, 80) : '', createdAt: l.createdAt, sold: !!l.sold,
    cover: firstImg ? firstImg.url : '', hasVideo: (l.media || []).some((m) => m.type === 'video'), mediaCount: (l.media || []).length
  };
}
function publicSettings() {
  const s = db.settings;
  const count = (c) => db.listings.filter((l) => l.published && !l.sold && l.category === c).length;
  return {
    siteName: s.siteName, tagline: s.tagline, phone: s.phone, whatsapp: s.whatsapp, instagram: s.instagram,
    currency: s.currency, covers: s.covers, counts: { property: count('property'), car: count('car') }
  };
}

// حذف فایل‌های آپلودشده‌ای که به هیچ آگهی وصل نشده‌اند (قدیمی‌تر از ۲۴ ساعت)
function cleanupOrphans() {
  const used = new Set();
  db.listings.forEach((l) => (l.media || []).forEach((m) => used.add(path.basename(m.url))));
  Object.values(db.settings.covers).forEach((u) => u && used.add(path.basename(u)));
  fs.readdir(UP, (err, files) => {
    if (err) return;
    for (const f of files) {
      if (used.has(f)) continue;
      const full = path.join(UP, f);
      fs.stat(full, (e, st) => { if (!e && Date.now() - st.mtimeMs > 864e5) fs.unlink(full, () => {}); });
    }
  });
}

// ---------- آگهی‌های نمونه (seed/demo.json) ----------
// فقط یک بار اضافه می‌شوند؛ اگر مدیر بعداً حذفشان کند دوباره برنمی‌گردند. آگهی‌های واقعی دست نمی‌خورند.
function seedDemo() {
  const dir = path.join(__dirname, 'seed');
  let demo;
  try { demo = JSON.parse(fs.readFileSync(path.join(dir, 'demo.json'), 'utf8')); } catch (_) { return; }
  if (!demo.version || db.meta.seeded === demo.version) return;
  const now = Date.now();
  let added = 0;
  (demo.listings || []).forEach((d, i) => {
    if (!/^[a-f0-9]{8}$/.test(d.id || '') || db.listings.some((x) => x.id === d.id)) return;
    const media = [];
    for (const f of d.media || []) {
      if (!/^[a-f0-9]{16}\.webp$/.test(f)) continue;
      try { fs.copyFileSync(path.join(dir, 'media', f), path.join(UP, f)); media.push({ url: '/uploads/' + f }); } catch (_) { /* */ }
    }
    const r = cleanListing(Object.assign({}, d, { media }), null);
    if (r.error) return;
    r.value.id = d.id;
    r.value.createdAt = r.value.updatedAt = new Date(now - i * 7 * 3600e3).toISOString();
    db.listings.push(r.value);
    added++;
  });
  const car = db.settings.templates.car;
  if (car && Array.isArray(car.fields) && !car.fields.includes('نوع خودرو')) car.fields.unshift('نوع خودرو');
  db.meta.seeded = demo.version;
  saveSync();
  if (added) console.log(added + ' آگهی نمونه اضافه شد');
}
seedDemo();

// ---------- احراز هویت ----------
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('hex');
function makeToken() { const exp = Date.now() + 30 * 864e5; return exp + '.' + sign(String(exp)); }
function validToken(t) {
  if (!t) return false;
  const [e, s] = String(t).split('.');
  if (!e || !s || Number(e) < Date.now()) return false;
  const a = Buffer.from(s), b = Buffer.from(sign(e));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function getCookie(req, name) {
  const h = req.headers.cookie || '';
  for (const part of h.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}
const isAdmin = (req) => validToken(getCookie(req, 'adm'));
const isHttps = (req) => (req.headers['x-forwarded-proto'] || '').split(',')[0] === 'https';
const attempts = new Map();
function tooMany(ip) {
  const now = Date.now(), a = attempts.get(ip);
  if (!a || now - a.t > 15 * 60e3) { attempts.set(ip, { n: 0, t: now }); return false; }
  return a.n >= 8;
}
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();

// ---------- پاسخ‌ها ----------
const SEC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'"
};
function send(res, code, body, headers = {}) {
  res.writeHead(code, Object.assign({}, SEC_HEADERS, headers));
  res.end(body);
}
const json = (res, code, obj, headers = {}) => send(res, code, JSON.stringify(obj), Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, headers));

function readJSON(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function serveFile(req, res, full, cache) {
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    const ext = path.extname(full).toLowerCase();
    const etag = '"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + '"';
    const headers = Object.assign({}, SEC_HEADERS, {
      'Content-Type': MIME[ext] || 'application/octet-stream', 'Accept-Ranges': 'bytes', ETag: etag, 'Cache-Control': cache
    });
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range && (range[1] || range[2])) {
      let start = range[1] ? Number(range[1]) : st.size - Number(range[2]);
      let end = range[1] && range[2] ? Number(range[2]) : st.size - 1;
      if (start < 0) start = 0;
      if (end >= st.size) end = st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, Object.assign(headers, { 'Content-Range': 'bytes */' + st.size })); return res.end(); }
      res.writeHead(206, Object.assign(headers, { 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 }));
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(full, { start, end }).pipe(res);
    }
    res.writeHead(200, Object.assign(headers, { 'Content-Length': st.size }));
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(full).pipe(res);
  });
}
// نسخهٔ فایل‌های css/js: با هر اجرای سرور (هر آپدیت) عوض می‌شود تا مرورگر و گوشی فایل قدیمی را از حافظه نخوانند
const BUILD = Date.now().toString(36);
const withVersion = (html) => String(html).replace(/((?:href|src)="\/(?:css|js|admin)\/[^"?]+\.(?:css|js))"/g, '$1?v=' + BUILD + '"');
function notFound(res) {
  fs.readFile(path.join(PUB, '404.html'), 'utf8', (e, html) => send(res, 404, e ? 'Not found' : withVersion(html), { 'Content-Type': 'text/html; charset=utf-8' }));
}
function page(req, res, file) {
  fs.readFile(path.join(PUB, file), 'utf8', (err, html) => {
    if (err) return notFound(res);
    send(res, 200, req.method === 'HEAD' ? '' : withVersion(html), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  });
}

// صفحهٔ آگهی با متای اشتراک‌گذاری (برای نمایش زیبا در اینستاگرام/تلگرام/واتساپ)
function itemPage(req, res, id) {
  const l = db.listings.find((x) => x.id === id && x.published);
  if (!l) return notFound(res);
  fs.readFile(path.join(PUB, 'item.html'), 'utf8', (err, html) => {
    if (err) return notFound(res);
    const proto = isHttps(req) ? 'https' : 'http';
    const base = proto + '://' + (req.headers.host || 'localhost');
    const img = (l.media || []).find((m) => m.type === 'image');
    const desc = l.description || l.address || db.settings.siteName;
    const og = [
      `<title>${esc(l.title)} | ${esc(db.settings.siteName)}</title>`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:title" content="${esc(l.title)}">`,
      `<meta property="og:description" content="${esc(desc.slice(0, 160))}">`,
      `<meta property="og:url" content="${esc(base + '/l/' + l.id)}">`,
      img ? `<meta property="og:image" content="${esc(base + img.url)}">` : ''
    ].join('\n');
    send(res, 200, withVersion(html.replace('<!--OG-->', og)), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  });
}

// ---------- آپلود فایل خام (بدون multipart) ----------
function receiveFile(req, res, opts, done) {
  const name = str(new URL(req.url, 'http://x').searchParams.get('name'), 200).toLowerCase();
  const ext = path.extname(name);
  const type = EXT_TYPE[ext];
  if (!type) return json(res, 400, { error: 'فرمت فایل مجاز نیست (عکس: jpg/png/webp، ویدیو: mp4/webm/mov)' });
  if (opts.imageOnly && type !== 'image') return json(res, 400, { error: 'فقط عکس مجاز است' });
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > MAX_UPLOAD) return json(res, 413, { error: 'حجم فایل بیش از ۳۰۰ مگابایت است' });
  const fname = crypto.randomBytes(8).toString('hex') + ext;
  const full = path.join(UP, fname);
  const out = fs.createWriteStream(full);
  let size = 0, aborted = false;
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_UPLOAD && !aborted) { aborted = true; out.destroy(); fs.unlink(full, () => {}); json(res, 413, { error: 'حجم فایل بیش از ۳۰۰ مگابایت است' }); req.destroy(); }
  });
  req.pipe(out);
  req.on('aborted', () => { aborted = true; out.destroy(); fs.unlink(full, () => {}); });
  out.on('error', () => { if (!aborted) json(res, 500, { error: 'ذخیره فایل انجام نشد' }); });
  out.on('finish', async () => {
    if (aborted) return;
    if (size === 0) { fs.unlink(full, () => {}); return json(res, 400, { error: 'فایل خالی است' }); }
    let finalName = fname;
    if (type === 'image' && sharp && ext !== '.gif') {
      try {
        finalName = fname.replace(ext, '') + '.webp';
        await sharp(full, { failOn: 'none' }).rotate().resize({ width: opts.width || 1800, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(UP, finalName));
        fs.unlink(full, () => {});
      } catch (_) { finalName = fname; fs.unlink(path.join(UP, fname.replace(ext, '') + '.webp'), () => {}); }
    }
    done({ type, url: '/uploads/' + finalName });
  });
}

// ---------- API ----------
async function api(req, res, u, p) {
  const m = req.method;
  const origin = req.headers.origin;
  if (m !== 'GET' && m !== 'HEAD' && origin) {
    let ok = false; try { ok = new URL(origin).host === req.headers.host; } catch (_) { /* */ }
    if (!ok) return json(res, 403, { error: 'درخواست نامعتبر' });
  }

  // عمومی
  if (m === 'GET' && p === '/api/settings') return json(res, 200, publicSettings());
  if (m === 'GET' && p === '/api/listings') {
    const cat = u.searchParams.get('category');
    const list = db.listings.filter((l) => l.published && (!cat || l.category === cat))
      .sort((a, b) => (a.sold - b.sold) || (b.createdAt < a.createdAt ? -1 : 1)).map(summary);
    return json(res, 200, list);
  }
  let mm;
  if (m === 'GET' && (mm = /^\/api\/listings\/([a-f0-9]{8})$/.exec(p))) {
    const l = db.listings.find((x) => x.id === mm[1] && (x.published || isAdmin(req)));
    return l ? json(res, 200, l) : json(res, 404, { error: 'پیدا نشد' });
  }

  // ورود
  if (m === 'POST' && p === '/api/admin/login') {
    const ip = req.socket.remoteAddress + '|' + (req.headers['x-forwarded-for'] || '');
    if (tooMany(ip)) return json(res, 429, { error: 'تلاش بیش از حد. بعد از ۱۵ دقیقه دوباره امتحان کنید.' });
    let body; try { body = await readJSON(req); } catch (_) { return json(res, 400, { error: 'درخواست نامعتبر' }); }
    const ok = crypto.timingSafeEqual(sha(body.password || ''), sha(ADMIN_PASSWORD));
    if (!ok) { const a = attempts.get(ip) || { n: 0, t: Date.now() }; a.n++; attempts.set(ip, a); return json(res, 401, { error: 'رمز اشتباه است' }); }
    attempts.delete(ip);
    const cookie = `adm=${makeToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${30 * 86400}` + (isHttps(req) ? '; Secure' : '');
    return json(res, 200, { ok: true }, { 'Set-Cookie': cookie });
  }
  if (m === 'POST' && p === '/api/admin/logout') {
    return json(res, 200, { ok: true }, { 'Set-Cookie': 'adm=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }

  // از اینجا به بعد فقط مدیر
  if (!p.startsWith('/api/admin/')) return json(res, 404, { error: 'پیدا نشد' });
  if (!isAdmin(req)) return json(res, 401, { error: 'وارد نشده‌اید' });

  if (m === 'GET' && p === '/api/admin/me') return json(res, 200, { ok: true });
  if (m === 'GET' && p === '/api/admin/settings') return json(res, 200, db.settings);
  if (m === 'GET' && p === '/api/admin/listings') {
    return json(res, 200, db.listings.slice().sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1)));
  }

  if (m === 'PUT' && p === '/api/admin/upload') {
    return receiveFile(req, res, {}, (r) => json(res, 200, r));
  }

  if (m === 'POST' && p === '/api/admin/listings') {
    let body; try { body = await readJSON(req, 2 * 1024 * 1024); } catch (_) { return json(res, 400, { error: 'درخواست نامعتبر' }); }
    const r = cleanListing(body, null);
    if (r.error) return json(res, 400, { error: r.error });
    db.listings.push(r.value); save();
    return json(res, 200, r.value);
  }
  if ((m === 'PUT' || m === 'DELETE') && (mm = /^\/api\/admin\/listings\/([a-f0-9]{8})$/.exec(p))) {
    const idx = db.listings.findIndex((x) => x.id === mm[1]);
    if (idx < 0) return json(res, 404, { error: 'پیدا نشد' });
    const old = db.listings[idx];
    if (m === 'DELETE') {
      old.media.forEach((x) => unlinkUpload(x.url));
      db.listings.splice(idx, 1); save();
      return json(res, 200, { ok: true });
    }
    let body; try { body = await readJSON(req, 2 * 1024 * 1024); } catch (_) { return json(res, 400, { error: 'درخواست نامعتبر' }); }
    const r = cleanListing(body, old);
    if (r.error) return json(res, 400, { error: r.error });
    const keep = new Set(r.value.media.map((x) => x.url));
    old.media.filter((x) => !keep.has(x.url)).forEach((x) => unlinkUpload(x.url));
    db.listings[idx] = r.value; save();
    return json(res, 200, r.value);
  }

  if (m === 'PUT' && p === '/api/admin/settings') {
    let body; try { body = await readJSON(req); } catch (_) { return json(res, 400, { error: 'درخواست نامعتبر' }); }
    const s = db.settings;
    s.siteName = str(body.siteName, 80) || DEFAULT_SETTINGS.siteName;
    s.tagline = str(body.tagline, 120);
    s.phone = str(faDigits(body.phone), 30);
    s.whatsapp = str(faDigits(body.whatsapp), 30);
    s.instagram = str(body.instagram, 120);
    s.currency = str(body.currency, 20);
    const lines = (v, n) => (Array.isArray(v) ? v : []).map((x) => str(x, 120)).filter(Boolean).slice(0, n);
    for (const c of CATS) {
      const t = (body.templates || {})[c] || {};
      s.templates[c] = { fields: lines(t.fields, 30), questions: lines(t.questions, 30) };
    }
    save();
    return json(res, 200, s);
  }
  if ((mm = /^\/api\/admin\/cover\/(property|car)$/.exec(p))) {
    const cat = mm[1];
    if (m === 'DELETE') { unlinkUpload(db.settings.covers[cat]); db.settings.covers[cat] = ''; save(); return json(res, 200, { ok: true }); }
    if (m === 'PUT') {
      return receiveFile(req, res, { imageOnly: true, width: 1400 }, (r) => {
        unlinkUpload(db.settings.covers[cat]);
        db.settings.covers[cat] = r.url; save();
        json(res, 200, r);
      });
    }
  }
  return json(res, 404, { error: 'پیدا نشد' });
}

// ---------- سرور ----------
const server = http.createServer(async (req, res) => {
  try {
    let u, p;
    try { u = new URL(req.url, 'http://x'); p = decodeURIComponent(u.pathname); } catch (_) { return send(res, 400, 'Bad request'); }
    if (p.includes('\0')) return send(res, 400, 'Bad request');

    if (p.startsWith('/api/')) return await api(req, res, u, p);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

    if (p.startsWith('/uploads/')) {
      const f = path.basename(p);
      if (!/^[a-f0-9]{16}\.[a-z0-9]{2,5}$/.test(f)) return notFound(res);
      return serveFile(req, res, path.join(UP, f), 'public, max-age=2592000, immutable');
    }
    if (p === '/') return page(req, res, 'index.html');
    let mm;
    if ((mm = /^\/c\/(property|car)\/?$/.exec(p))) return page(req, res, 'category.html');
    if ((mm = /^\/l\/([a-f0-9]{8})\/?$/.exec(p))) return itemPage(req, res, mm[1]);
    if (p === '/admin' || p === '/admin/') return page(req, res, 'admin/index.html');

    const full = path.join(PUB, path.normalize(p));
    if (!full.startsWith(PUB + path.sep) || /(^|[\\/])\./.test(path.relative(PUB, full))) return notFound(res);
    if (path.basename(full) === 'item.html' || path.basename(full) === 'index.html' && full === path.join(PUB, 'index.html')) return notFound(res);
    if (/\.html$/.test(full)) return page(req, res, path.relative(PUB, full));
    const dev = process.env.NODE_ENV !== 'production';
    const versioned = u.searchParams.has('v');
    return serveFile(req, res, full, dev ? 'no-cache' : versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: 'خطای سرور' });
  }
});
server.requestTimeout = 0;      // آپلود ویدیوی بزرگ
server.headersTimeout = 30000;
server.listen(PORT, HOST, () => {
  console.log(`سایت روی http://${HOST}:${PORT} اجرا شد` + (sharp ? ' (بهینه‌سازی عکس فعال)' : ' (بدون بهینه‌سازی عکس)'));
  cleanupOrphans();
});
process.on('SIGTERM', () => { saveSync(); process.exit(0); });
process.on('SIGINT', () => { saveSync(); process.exit(0); });
