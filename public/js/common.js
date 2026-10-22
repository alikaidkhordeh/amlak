'use strict';
/* ابزارهای مشترک سایت */
const fa = (s) => String(s == null ? '' : s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'value') e.value = v;
    else if (k === 'checked') e.checked = !!v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(c));
  }
  return e;
}
const svgEl = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const icon = (paths, cls) => svgEl(`<svg class="${cls || 'ico'}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`);
const IC = {
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'
};
/* نماد کوچک برای آگهی بدون عکس */
const ART = {
  property: '<svg viewBox="0 0 400 260" aria-hidden="true"><path d="M40 130 200 28 360 130"/><path d="M70 112v128h260V112"/><path d="M168 240v-78h64v78"/><path d="M96 150h46v40H96zM258 150h46v40h-46z"/></svg>',
  car: '<svg viewBox="0 0 400 220" aria-hidden="true"><path d="M28 150c0-22 12-30 34-34l46-26c20-18 42-24 70-24h70c24 0 40 12 56 32l34 8c22 4 34 16 34 44z"/><path d="M122 96l30-22h22v28zM186 74h62c12 0 22 10 34 28H186z"/><circle cx="104" cy="152" r="27"/><circle cx="296" cy="152" r="27"/></svg>'
};
const CAT_NAME = { property: 'املاک', car: 'خودرو' };

const nf = new Intl.NumberFormat('fa-IR');
function priceParts(price, currency) {
  if (!price) return null;
  if (!/^\d+$/.test(price)) return { text: fa(price), words: '', cur: '' };
  const n = Number(price);
  let words = '';
  if (n >= 1e6) {
    const bil = Math.floor(n / 1e9), mil = Math.floor((n % 1e9) / 1e6);
    const parts = [];
    if (bil) parts.push(fa(bil) + ' میلیارد');
    if (mil) parts.push(fa(mil) + ' میلیون');
    words = parts.join(' و ');
  }
  return { text: nf.format(n), words, cur: currency || '' };
}
const shortPrice = (price, currency) => {
  const p = priceParts(price, currency);
  return p ? p.text + (p.cur ? ' ' + p.cur : '') : '';
};
/* قیمت کوتاه برای کارت‌ها: «۲۸ میلیارد تومان» */
function cardPrice(price, currency) {
  const p = priceParts(price, currency);
  if (!p) return null;
  return h('div', { class: 'price' }, p.words || p.text, p.cur ? h('small', null, p.cur) : null);
}
function jdate(iso) {
  try { return new Intl.DateTimeFormat('fa-IR', { calendar: 'persian', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso)); }
  catch (_) { return ''; }
}

let _settings;
function getSettings() {
  if (!_settings) _settings = fetch('/api/settings').then((r) => r.json()).catch(() => ({}));
  return _settings;
}
function applyBrand(s) {
  if (!s || !s.siteName) return;
  const b = document.getElementById('brand');
  if (b) b.textContent = s.siteName;
  const t = document.getElementById('tagline');
  if (t && s.tagline) { t.textContent = s.tagline; t.hidden = false; }
  if (!document.body.dataset.keepTitle) document.title = s.siteName;
}

function waLink(num) {
  let d = String(num || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '98' + d.slice(1);
  return 'https://wa.me/' + d;
}
function igLink(v) {
  v = String(v || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return 'https://instagram.com/' + v.replace(/^@/, '').replace(/[^\w.]/g, '');
}
function contactLinks(s, cls) {
  const out = [];
  if (s.phone) out.push(h('a', { class: cls, href: 'tel:' + s.phone.replace(/[^\d+]/g, '') }, 'تماس: ' + fa(s.phone)));
  const w = waLink(s.whatsapp);
  if (w) out.push(h('a', { class: cls, href: w, target: '_blank', rel: 'noopener' }, 'واتساپ'));
  const i = igLink(s.instagram);
  if (i) out.push(h('a', { class: cls, href: i, target: '_blank', rel: 'noopener' }, 'اینستاگرام'));
  return out;
}

/* پاورقی مشترک همهٔ صفحه‌ها */
function renderFooter(s) {
  const f = document.getElementById('foot');
  if (!f) return;
  const links = contactLinks(s, 'chip');
  let year = '';
  try { year = new Intl.DateTimeFormat('fa-IR', { calendar: 'persian', year: 'numeric' }).format(new Date()); } catch (_) { /* */ }
  f.replaceChildren(
    h('div', { class: 'foot-in' },
      h('div', null, h('div', { class: 'fb' }, s.siteName || ''), s.tagline ? h('p', { class: 'ft' }, s.tagline) : null),
      links.length ? h('div', { class: 'contacts' }, links) : null),
    h('div', { class: 'foot-end' },
      h('span', null, '© ' + year + ' — ' + (s.siteName || '')),
      h('a', { href: '/credits.html' }, 'منبع تصاویر')));
}

/* کارت آگهی — هر بخش خالی اصلاً نمایش داده نمی‌شود */
function listingCard(l, s, opts) {
  const thumb = h('div', { class: 'thumb' });
  if (l.cover) thumb.append(h('img', { src: l.cover, alt: '', loading: 'lazy', decoding: 'async' }));
  else { const ph = h('div', { class: 'ph' }); ph.append(svgEl(ART[l.category])); thumb.append(ph); }
  if (opts && opts.showCat) thumb.append(h('span', { class: 'ctag' }, CAT_NAME[l.category]));
  else if (l.kind) thumb.append(h('span', { class: 'ctag' }, fa(l.kind)));
  if (l.sold) thumb.append(h('span', { class: 'ctag sold' }, 'فروخته شد'));
  else if (l.hasVideo) thumb.append(h('span', { class: 'ctag dark' }, 'ویدیو'));
  if (l.mediaCount > 1) thumb.append(h('span', { class: 'nmed' }, icon(IC.cam), fa(l.mediaCount)));
  const specs = (l.specs || []).filter((x) => x && x.value);
  return h('a', { class: 'card rv' + (l.sold ? ' is-sold' : ''), href: '/l/' + l.id },
    thumb,
    h('div', { class: 'body' },
      h('h3', null, fa(l.title)),
      specs.length ? h('div', { class: 'specs' }, specs.map((x) => h('span', { title: x.label }, fa(x.value)))) : null,
      l.address ? h('div', { class: 'addr' }, icon(IC.pin), fa(l.address)) : null,
      h('div', { class: 'cfoot' },
        cardPrice(l.price, s.currency) || (l.createdAt ? h('span', { class: 'date' }, jdate(l.createdAt)) : null),
        h('span', { class: 'cgo' }, icon(IC.left)))));
}

/* ظاهر شدن نرم هنگام اسکرول */
function reveal(root) {
  const els = (root || document).querySelectorAll('.rv:not(.in)');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en, i) => {
      if (!en.isIntersecting) return;
      en.target.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -40px 0px' });
  els.forEach((e) => io.observe(e));
}
