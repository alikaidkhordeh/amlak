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
/* صحنه‌های تصویری دکمه‌های صفحهٔ اصلی (وقتی عکس واقعی در پنل نگذاشته باشند) */
const SCENE = {
  property: `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
<defs>
<linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2f2b"/><stop offset=".55" stop-color="#2f6b5e"/><stop offset="1" stop-color="#d7a65f"/></linearGradient>
<linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3a0"/><stop offset="1" stop-color="#e0a44a"/></linearGradient>
<linearGradient id="hw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2ede1"/><stop offset="1" stop-color="#d8d1bf"/></linearGradient>
<radialGradient id="hl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
</defs>
<rect width="800" height="760" fill="url(#hs)"/><g transform="translate(0,-40)">
<circle cx="610" cy="170" r="130" fill="#f3c97a" opacity=".16"/><circle cx="610" cy="170" r="72" fill="#f6d794" opacity=".9"/>
<g fill="#fff" opacity=".7"><circle cx="90" cy="70" r="2"/><circle cx="220" cy="40" r="1.6"/><circle cx="340" cy="90" r="1.8"/><circle cx="470" cy="46" r="1.5"/><circle cx="740" cy="80" r="2"/><circle cx="150" cy="140" r="1.4"/></g>
<path d="M0 420c90-34 170-40 260-18s160 6 240-14 190-30 300 8v204H0z" fill="#1d5148"/>
<rect y="455" width="800" height="320" fill="#10302a"/>
<ellipse cx="400" cy="470" rx="330" ry="30" fill="url(#hl)"/>
<g><rect x="168" y="318" width="372" height="14" fill="#12202b"/><rect x="190" y="332" width="330" height="128" fill="url(#hw)"/>
<rect x="288" y="226" width="326" height="14" fill="#12202b"/><rect x="304" y="240" width="294" height="92" fill="#cdc5b2"/>
<rect x="312" y="252" width="118" height="64" rx="3" fill="url(#hg)"/><path d="M371 252v64M312 284h118" stroke="#12202b" stroke-width="3"/>
<rect x="468" y="252" width="118" height="64" rx="3" fill="url(#hg)"/><path d="M527 252v64M468 284h118" stroke="#12202b" stroke-width="3"/>
<rect x="212" y="352" width="158" height="92" rx="3" fill="url(#hg)"/><path d="M265 352v92M318 352v92" stroke="#12202b" stroke-width="3"/>
<rect x="400" y="366" width="54" height="94" fill="#7a5426"/><path d="M427 366v94" stroke="#4d3417" stroke-width="2"/><circle cx="445" cy="414" r="3" fill="#f3d49a"/>
<rect x="474" y="356" width="36" height="72" rx="3" fill="url(#hg)"/>
<rect x="190" y="458" width="330" height="8" fill="#12202b" opacity=".35"/></g>
<path d="M400 466h54l78 134H322z" fill="#e9dfc8" opacity=".22"/>
<g><ellipse cx="108" cy="400" rx="26" ry="98" fill="#0f3a33"/><ellipse cx="108" cy="400" rx="14" ry="90" fill="#17504a" opacity=".8"/>
<ellipse cx="690" cy="392" rx="30" ry="108" fill="#0f3a33"/><ellipse cx="690" cy="392" rx="16" ry="98" fill="#17504a" opacity=".8"/>
<circle cx="168" cy="462" r="26" fill="#1c5b50"/><circle cx="196" cy="468" r="20" fill="#25695c"/><circle cx="548" cy="466" r="24" fill="#1c5b50"/><circle cx="576" cy="470" r="19" fill="#25695c"/></g>
</g></svg>`,
  car: `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
<defs>
<linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a141b"/><stop offset=".6" stop-color="#2a4254"/><stop offset="1" stop-color="#6f7f86"/></linearGradient>
<linearGradient id="cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9cf92"/><stop offset=".45" stop-color="#c39a50"/><stop offset="1" stop-color="#7d5a22"/></linearGradient>
<linearGradient id="cw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4b5e"/><stop offset="1" stop-color="#0c1a23"/></linearGradient>
<radialGradient id="cr" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#eef1f1"/><stop offset="1" stop-color="#7d878b"/></radialGradient>
<linearGradient id="cl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffefb8" stop-opacity=".5"/><stop offset="1" stop-color="#ffefb8" stop-opacity="0"/></linearGradient>
</defs>
<rect width="800" height="760" fill="url(#cs)"/><g transform="translate(0,-80)">
<g fill="#0c1a22" opacity=".85"><path d="M0 400V340h60v-40h50v60h40v-90h70v70h50v-30h60v60h50v-110h60v90h60v-50h70v40h40v-70h60v80h50v-40h60v100z"/></g>
<g fill="#ffdc8c" opacity=".55"><rect x="80" y="320" width="8" height="8"/><rect x="180" y="290" width="8" height="8"/><rect x="190" y="320" width="8" height="8"/><rect x="420" y="300" width="8" height="8"/><rect x="520" y="330" width="8" height="8"/><rect x="620" y="310" width="8" height="8"/><rect x="705" y="340" width="8" height="8"/></g>
<rect y="448" width="800" height="340" fill="#0a1218"/><rect y="444" width="800" height="5" fill="#c39a50" opacity=".5"/>
<g fill="#c39a50" opacity=".55"><rect x="30" y="556" width="90" height="8" rx="4"/><rect x="190" y="556" width="90" height="8" rx="4"/><rect x="350" y="556" width="90" height="8" rx="4"/><rect x="510" y="556" width="90" height="8" rx="4"/><rect x="670" y="556" width="90" height="8" rx="4"/></g>
<path d="M650 410l150-34v118z" fill="url(#cl)"/>
<ellipse cx="410" cy="490" rx="300" ry="16" fill="#000" opacity=".5"/>
<path d="M118 446c0-26 18-36 52-42l70-14c32-36 78-66 150-68h96c50 2 84 28 112 66l62 10c34 6 50 22 50 48z" fill="url(#cb)"/>
<path d="M258 390c22-30 52-50 96-54h40v54zM410 336h92c30 2 52 22 70 54H410z" fill="url(#cw)"/>
<path d="M270 388c20-26 46-42 84-46" fill="none" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>
<path d="M394 336v108M170 418c90-14 360-16 500 0" fill="none" stroke="#7d5a22" stroke-width="2.5" opacity=".7"/>
<path d="M150 410c140-24 420-26 520-6" fill="none" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>
<rect x="408" y="400" width="34" height="7" rx="3.5" fill="#6b4c1b"/>
<path d="M662 404c12 2 20 8 22 18l-30 2z" fill="#fff6cf"/><rect x="118" y="410" width="18" height="14" rx="3" fill="#b3402f"/>
<circle cx="248" cy="448" r="48" fill="#0a1218"/><circle cx="568" cy="448" r="48" fill="#0a1218"/>
<g><circle cx="248" cy="450" r="38" fill="#171f25"/><circle cx="248" cy="450" r="26" fill="url(#cr)"/><g stroke="#4b565b" stroke-width="3"><path d="M248 426v48M224 450h48M231 433l34 34M265 433l-34 34"/></g><circle cx="248" cy="450" r="7" fill="#2a3338"/></g>
<g><circle cx="568" cy="450" r="38" fill="#171f25"/><circle cx="568" cy="450" r="26" fill="url(#cr)"/><g stroke="#4b565b" stroke-width="3"><path d="M568 426v48M544 450h48M551 433l34 34M585 433l-34 34"/></g><circle cx="568" cy="450" r="7" fill="#2a3338"/></g>
</g></svg>`
};
const CHEVRON ='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
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
