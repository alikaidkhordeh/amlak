'use strict';
const app = document.getElementById('app');
let settings = null, listings = [], filter = 'all', tab = 'list';

/* ---------- ارتباط با سرور ---------- */
async function api(method, url, body) {
  const r = await fetch(url, {
    method, credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  let j = {}; try { j = await r.json(); } catch (_) { /* */ }
  if (r.status === 401 && url !== '/api/admin/login') { showLogin(); throw new Error('login'); }
  if (!r.ok) throw new Error(j.error || 'خطایی رخ داد');
  return j;
}
function upload(file, url, onprog) {
  return new Promise((res, rej) => {
    const x = new XMLHttpRequest();
    x.open('PUT', url + (url.includes('?') ? '&' : '?') + 'name=' + encodeURIComponent(file.name));
    x.upload.onprogress = (e) => e.lengthComputable && onprog && onprog(e.loaded / e.total);
    x.onload = () => {
      let j = {}; try { j = JSON.parse(x.responseText); } catch (_) { /* */ }
      if (x.status === 401) { showLogin(); return rej(new Error('login')); }
      x.status < 300 ? res(j) : rej(new Error(j.error || 'آپلود انجام نشد'));
    };
    x.onerror = () => rej(new Error('خطای شبکه در آپلود'));
    x.send(file);
  });
}
const notice = (box, text, kind) => { box.replaceChildren(text ? h('div', { class: 'msg ' + (kind || 'err') }, text) : ''); };

/* ---------- ورود ---------- */
function showLogin() {
  const msg = h('div');
  const pw = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'رمز مدیریت' });
  const go = async () => {
    try { await api('POST', '/api/admin/login', { password: pw.value }); boot(); }
    catch (e) { notice(msg, e.message); }
  };
  pw.addEventListener('keydown', (e) => e.key === 'Enter' && go());
  app.replaceChildren(h('div', { class: 'login' },
    h('div', { class: 'panel' },
      h('h2', null, 'ورود به پنل مدیریت'), msg,
      h('label', { class: 'f' }, 'رمز', pw),
      h('button', { class: 'b', style: 'width:100%', type: 'button', onclick: go }, 'ورود'))));
  pw.focus();
}

/* ---------- قالب اصلی ---------- */
function shell(content) {
  app.replaceChildren(
    h('div', { class: 'a-bar' },
      h('b', null, 'پنل مدیریت'),
      h('div', { class: 'row' },
        h('a', { class: 'b w s', href: '/', target: '_blank', rel: 'noopener' }, 'مشاهده سایت'),
        h('button', { class: 'b w s', type: 'button', onclick: async () => { await api('POST', '/api/admin/logout').catch(() => {}); showLogin(); } }, 'خروج'))),
    h('div', { class: 'a-wrap' }, content));
}
async function boot() {
  try {
    [settings, listings] = await Promise.all([api('GET', '/api/admin/settings'), api('GET', '/api/admin/listings')]);
  } catch (e) { if (e.message !== 'login') showLogin(); return; }
  render();
}
function render() { tab === 'settings' ? renderSettings() : renderList(); }
const tabs = () => h('div', { class: 'a-tabs' },
  h('button', { class: tab === 'list' ? 'on' : '', type: 'button', onclick: () => { tab = 'list'; render(); } }, 'آگهی‌ها'),
  h('button', { class: tab === 'settings' ? 'on' : '', type: 'button', onclick: () => { tab = 'settings'; render(); } }, 'تنظیمات سایت'));

/* ---------- فهرست آگهی‌ها ---------- */
function renderList() {
  const box = h('div', { class: 'panel' });
  const shown = listings.filter((l) => filter === 'all' || l.category === filter);
  if (!shown.length) box.append(h('p', { class: 'hint' }, 'هنوز آگهی‌ای ثبت نشده. با «آگهی جدید» شروع کنید.'));
  for (const l of shown) {
    const img = (l.media || []).find((m) => m.type === 'image');
    const msg = h('span');
    box.append(h('div', { class: 'lrow' },
      h('div', { class: 'th' }, img ? h('img', { src: img.url, alt: '' }) : null),
      h('div', { class: 'mid' },
        h('div', { class: 't' }, l.title),
        h('div', { class: 'm' },
          h('span', { class: 'tag' }, CAT_NAME[l.category]),
          !l.published ? h('span', { class: 'tag y' }, 'پیش‌نویس') : null,
          l.sold ? h('span', { class: 'tag x' }, 'فروخته شد') : null,
          jdate(l.createdAt) + (l.price ? ' · ' + shortPrice(l.price, settings.currency) : ''))),
      h('div', { class: 'btns' },
        h('button', { class: 'b o s', type: 'button', onclick: () => renderEditor(l) }, 'ویرایش'),
        l.published ? h('a', { class: 'b o s', href: '/l/' + l.id, target: '_blank', rel: 'noopener' }, 'نمایش') : null,
        h('button', { class: 'b d s', type: 'button', onclick: async () => {
          if (!confirm('«' + l.title + '» برای همیشه حذف شود؟')) return;
          try { await api('DELETE', '/api/admin/listings/' + l.id); listings = listings.filter((x) => x.id !== l.id); renderList(); }
          catch (e) { alert(e.message); }
        } }, 'حذف'), msg)));
  }
  const f = (k, t) => h('button', { class: filter === k ? 'on' : '', type: 'button', onclick: () => { filter = k; renderList(); } }, t);
  shell([tabs(),
    h('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap' },
      h('div', { class: 'filters', style: 'margin:0' }, f('all', 'همه'), f('property', 'املاک'), f('car', 'خودرو')),
      h('button', { class: 'b', type: 'button', onclick: () => renderEditor(null) }, '+ آگهی جدید')),
    box]);
}

/* ---------- ویرایشگر آگهی ---------- */
function renderEditor(existing) {
  const d = existing ? JSON.parse(JSON.stringify(existing)) : {
    category: filter === 'car' ? 'car' : 'property', title: '', price: '', address: '', description: '',
    fields: [], qa: [], media: [], published: true, sold: false
  };
  const msg = h('div');
  let busy = 0;

  const segs = h('div', { class: 'seg' });
  const drawSeg = () => {
    segs.replaceChildren(...['property', 'car'].map((c) => h('button', {
      type: 'button', class: d.category === c ? 'on' : '', onclick: () => { d.category = c; drawSeg(); drawChips(); }
    }, CAT_NAME[c])));
  };

  /* رسانه */
  const mediaBox = h('div', { class: 'media' });
  const drawMedia = () => {
    const ups = [...mediaBox.querySelectorAll('.up')];
    mediaBox.replaceChildren(...d.media.map((m, i) => h('div', { class: 'mi' },
      m.type === 'image' ? h('img', { src: m.url, alt: '' }) : h('video', { src: m.url, muted: true, preload: 'metadata' }),
      i === 0 && m.type === 'image' ? h('span', { class: 'no' }, 'کاور') : null,
      h('div', { class: 'bar' },
        h('button', { type: 'button', 'aria-label': 'جلوتر', onclick: () => { if (i > 0) { [d.media[i - 1], d.media[i]] = [d.media[i], d.media[i - 1]]; drawMedia(); } } }, '›'),
        h('button', { type: 'button', 'aria-label': 'حذف', onclick: () => { d.media.splice(i, 1); drawMedia(); } }, '✕'),
        h('button', { type: 'button', 'aria-label': 'عقب‌تر', onclick: () => { if (i < d.media.length - 1) { [d.media[i + 1], d.media[i]] = [d.media[i], d.media[i + 1]]; drawMedia(); } } }, '‹')))),
      ...ups);
  };
  const fileIn = h('input', { type: 'file', multiple: true, hidden: true, accept: 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm' });
  fileIn.addEventListener('change', async () => {
    const files = [...fileIn.files]; fileIn.value = '';
    for (const file of files) {
      const tile = h('div', { class: 'mi up' }, file.name.slice(0, 18) + ' ۰٪');
      mediaBox.append(tile); busy++;
      try {
        const r = await upload(file, '/api/admin/upload', (p) => { tile.textContent = 'در حال آپلود ' + fa(Math.round(p * 100)) + '٪'; });
        tile.remove(); d.media.push({ type: r.type, url: r.url }); drawMedia();
      } catch (e) { tile.remove(); if (e.message !== 'login') notice(msg, file.name + ': ' + e.message); }
      busy--;
    }
  });

  /* مشخصات */
  const fieldsBox = h('div'), qaBox = h('div'), fieldChips = h('div', { class: 'chips' }), qaChips = h('div', { class: 'chips' });
  const drawFields = () => {
    fieldsBox.replaceChildren(...d.fields.map((f, i) => h('div', { class: 'pair' },
      h('input', { type: 'text', placeholder: 'عنوان (مثلاً متراژ)', value: f.label, oninput: (e) => (f.label = e.target.value) }),
      h('input', { type: 'text', class: 'val', placeholder: 'مقدار', value: f.value, oninput: (e) => (f.value = e.target.value) }),
      h('button', { class: 'b d x', type: 'button', 'aria-label': 'حذف', onclick: () => { d.fields.splice(i, 1); drawFields(); drawChips(); } }, '✕'))));
  };
  const drawQA = () => {
    qaBox.replaceChildren(...d.qa.map((x, i) => h('div', { class: 'panel', style: 'padding:12px' },
      h('div', { class: 'pair qa' },
        h('input', { type: 'text', placeholder: 'سؤال', value: x.q, oninput: (e) => (x.q = e.target.value) }),
        h('button', { class: 'b d x', type: 'button', 'aria-label': 'حذف', onclick: () => { d.qa.splice(i, 1); drawQA(); drawChips(); } }, '✕')),
      h('textarea', { placeholder: 'پاسخ', value: x.a, oninput: (e) => (x.a = e.target.value) }))));
  };
  const drawChips = () => {
    const t = (settings.templates || {})[d.category] || { fields: [], questions: [] };
    fieldChips.replaceChildren(...t.fields.map((n) => h('button', {
      type: 'button', disabled: d.fields.some((f) => f.label === n),
      onclick: () => { d.fields.push({ label: n, value: '' }); drawFields(); drawChips(); }
    }, '+ ' + n)));
    qaChips.replaceChildren(...t.questions.map((n) => h('button', {
      type: 'button', disabled: d.qa.some((x) => x.q === n),
      onclick: () => { d.qa.push({ q: n, a: '' }); drawQA(); drawChips(); }
    }, '+ ' + n)));
  };

  const inp = (key, props) => h('input', Object.assign({ type: 'text', value: d[key], oninput: (e) => (d[key] = e.target.value) }, props));
  const saveBtn = h('button', { class: 'b', type: 'button' }, 'ذخیره');
  saveBtn.onclick = async () => {
    if (busy) return notice(msg, 'صبر کنید تا آپلود فایل‌ها تمام شود.');
    saveBtn.disabled = true;
    try {
      const body = Object.assign({}, d, {
        fields: d.fields.filter((f) => f.label.trim() && f.value.trim()),
        qa: d.qa.filter((x) => x.q.trim() && x.a.trim())
      });
      const saved = existing ? await api('PUT', '/api/admin/listings/' + existing.id, body) : await api('POST', '/api/admin/listings', body);
      listings = existing ? listings.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...listings];
      filter = 'all'; renderList();
    } catch (e) { notice(msg, e.message); window.scrollTo({ top: 0, behavior: 'smooth' }); saveBtn.disabled = false; }
  };

  shell([
    h('h2', { style: 'margin:0 0 14px' }, existing ? 'ویرایش آگهی' : 'آگهی جدید'),
    msg,
    h('div', { class: 'panel' },
      h('label', { class: 'f' }, 'دسته‌بندی', segs),
      h('label', { class: 'f' }, 'عنوان', inp('title', { maxlength: '160', placeholder: 'مثلاً آپارتمان ۸۵ متری، نوساز' })),
      h('div', { class: 'two' },
        h('label', { class: 'f' }, [`قیمت (${settings.currency || 'تومان'}) `, h('small', null, '(خالی بگذارید تا نمایش داده نشود)'), inp('price', { inputmode: 'numeric', placeholder: 'مثلاً 2500000000' })]),
        h('label', { class: 'f' }, ['آدرس ', h('small', null, '(اختیاری)'), inp('address', { maxlength: '300' })])),
      h('label', { class: 'f' }, ['توضیحات ', h('small', null, '(اختیاری)'), h('textarea', { oninput: (e) => (d.description = e.target.value) }, d.description)])),
    h('div', { class: 'panel' },
      h('h2', null, 'عکس و ویدیو'),
      h('p', { class: 'hint' }, 'اختیاری. عکس اول، کاور آگهی است. با فلش‌ها ترتیب را عوض کنید.'),
      mediaBox,
      h('button', { class: 'b o', type: 'button', onclick: () => fileIn.click() }, '+ افزودن عکس / ویدیو'), fileIn),
    h('div', { class: 'panel' },
      h('h2', null, 'مشخصات'),
      h('p', { class: 'hint' }, 'فقط مواردی که مقدار دارند در سایت نمایش داده می‌شوند.'),
      fieldChips, fieldsBox,
      h('button', { class: 'b o s', type: 'button', onclick: () => { d.fields.push({ label: '', value: '' }); drawFields(); } }, '+ مشخصهٔ دلخواه')),
    h('div', { class: 'panel' },
      h('h2', null, 'پرسش و پاسخ'),
      h('p', { class: 'hint' }, 'سؤال‌هایی که جواب ندارند در سایت نمایش داده نمی‌شوند.'),
      qaChips, qaBox,
      h('button', { class: 'b o s', type: 'button', onclick: () => { d.qa.push({ q: '', a: '' }); drawQA(); } }, '+ سؤال دلخواه')),
    h('div', { class: 'panel' },
      h('label', { class: 'sw' }, h('input', { type: 'checkbox', checked: d.published, onchange: (e) => (d.published = e.target.checked) }), 'منتشر شود (خاموش = پیش‌نویس)'),
      h('label', { class: 'sw' }, h('input', { type: 'checkbox', checked: d.sold, onchange: (e) => (d.sold = e.target.checked) }), 'فروخته شد'),
      existing ? h('p', { class: 'hint', style: 'margin:0' }, 'تاریخ انتشار: ' + jdate(existing.createdAt)) : null),
    h('div', { class: 'sticky' }, saveBtn, h('button', { class: 'b o', type: 'button', onclick: renderList }, 'انصراف'))
  ]);
  drawSeg(); drawMedia(); drawFields(); drawQA(); drawChips();
}

/* ---------- تنظیمات ---------- */
function renderSettings() {
  const s = JSON.parse(JSON.stringify(settings));
  const msg = h('div');
  const inp = (key, label, props) => h('label', { class: 'f' }, label, h('input', Object.assign({ type: 'text', value: s[key] || '', oninput: (e) => (s[key] = e.target.value) }, props)));
  const lines = (cat, key, label) => h('label', { class: 'f' }, label,
    h('textarea', { oninput: (e) => (s.templates[cat][key] = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean)) }, (s.templates[cat][key] || []).join('\n')));

  const coverRow = (cat) => {
    const pv = h('div', { class: 'pv' }), note = h('span', { class: 'hint', style: 'margin:0' });
    const draw = () => pv.replaceChildren(settings.covers[cat] ? h('img', { src: settings.covers[cat] + '?' + Date.now(), alt: '' }) : 'عکس پیش‌فرض');
    const fi = h('input', { type: 'file', hidden: true, accept: 'image/jpeg,image/png,image/webp' });
    fi.addEventListener('change', async () => {
      const f = fi.files[0]; fi.value = ''; if (!f) return;
      try { note.textContent = 'در حال آپلود…'; const r = await upload(f, '/api/admin/cover/' + cat, (p) => (note.textContent = fa(Math.round(p * 100)) + '٪')); settings.covers[cat] = r.url; note.textContent = ''; draw(); }
      catch (e) { note.textContent = e.message; }
    });
    draw();
    return h('div', { class: 'cover' }, pv,
      h('div', null, h('b', null, 'دکمهٔ ' + CAT_NAME[cat]),
        h('div', { style: 'display:flex;gap:8px;margin-top:6px;flex-wrap:wrap' },
          h('button', { class: 'b o s', type: 'button', onclick: () => fi.click() }, 'انتخاب عکس'),
          h('button', { class: 'b d s', type: 'button', onclick: async () => { await api('DELETE', '/api/admin/cover/' + cat); settings.covers[cat] = ''; draw(); } }, 'حذف'), note), fi));
  };

  const save = h('button', { class: 'b', type: 'button' }, 'ذخیره تنظیمات');
  save.onclick = async () => {
    save.disabled = true;
    try { settings = Object.assign(await api('PUT', '/api/admin/settings', s), { covers: settings.covers }); notice(msg, 'ذخیره شد.', 'ok'); }
    catch (e) { notice(msg, e.message); }
    save.disabled = false; window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  shell([tabs(), msg,
    h('div', { class: 'panel' }, h('h2', null, 'اطلاعات سایت'),
      inp('siteName', 'نام (بالای سایت)'), inp('tagline', 'شعار (اختیاری)'),
      h('div', { class: 'two' }, inp('phone', 'شمارهٔ تماس', { type: 'tel', inputmode: 'tel' }), inp('whatsapp', 'شمارهٔ واتساپ', { type: 'tel', inputmode: 'tel' })),
      h('div', { class: 'two' }, inp('instagram', 'اینستاگرام (نام کاربری یا لینک)', { dir: 'ltr' }), inp('currency', 'واحد قیمت'))),
    h('div', { class: 'panel' }, h('h2', null, 'عکس دکمه‌های صفحهٔ اصلی'),
      h('p', { class: 'hint' }, 'عکس خانه و ماشین. اگر نگذارید، یک طرح ساده نمایش داده می‌شود.'), coverRow('property'), coverRow('car')),
    h('div', { class: 'panel' }, h('h2', null, 'پیشنهادهای املاک'),
      h('p', { class: 'hint' }, 'هر مورد در یک خط. هنگام ثبت آگهی با یک کلیک اضافه می‌شود.'),
      lines('property', 'fields', 'مشخصات'), lines('property', 'questions', 'سؤال‌ها')),
    h('div', { class: 'panel' }, h('h2', null, 'پیشنهادهای خودرو'),
      lines('car', 'fields', 'مشخصات'), lines('car', 'questions', 'سؤال‌ها')),
    h('div', { class: 'sticky' }, save)]);
}

boot();
