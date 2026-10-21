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

const ART = {
  property: '<svg viewBox="0 0 400 260" aria-hidden="true"><path d="M40 130 200 28 360 130"/><path d="M70 112v128h260V112"/><path d="M168 240v-78h64v78"/><path d="M96 150h46v40H96zM258 150h46v40h-46z"/><path d="M286 62V34h34v52"/></svg>',
  car: '<svg viewBox="0 0 400 220" aria-hidden="true"><path d="M28 150c0-22 12-30 34-34l46-26c20-18 42-24 70-24h70c24 0 40 12 56 32l34 8c22 4 34 16 34 44z"/><path d="M122 96l30-22h22v28zM186 74h62c12 0 22 10 34 28H186z"/><circle cx="104" cy="152" r="27" fill="#12202b"/><circle cx="104" cy="152" r="10"/><circle cx="296" cy="152" r="27" fill="#12202b"/><circle cx="296" cy="152" r="10"/></svg>'
};
const CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
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
