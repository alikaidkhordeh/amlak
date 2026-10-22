'use strict';
(async () => {
  const cat = location.pathname.split('/')[2] === 'car' ? 'car' : 'property';
  const HERO = { property: '/img/hero/villa-900.webp', car: '/img/hero/bmw-900.webp' };
  document.getElementById('title').textContent = CAT_NAME[cat];
  document.getElementById('crumb').textContent = CAT_NAME[cat];
  document.querySelector('.nav a[data-cat="' + cat + '"]').classList.add('on');

  const [s, list] = await Promise.all([
    getSettings(),
    fetch('/api/listings?category=' + cat).then((r) => r.json()).catch(() => null)
  ]);
  applyBrand(s);
  renderFooter(s);
  document.title = CAT_NAME[cat] + (s.siteName ? ' | ' + s.siteName : '');
  document.getElementById('pbg').style.backgroundImage = 'url("' + ((s.covers && s.covers[cat]) || HERO[cat]) + '")';

  const grid = document.getElementById('grid');
  const sub = document.getElementById('sub');
  if (!list) { grid.append(h('div', { class: 'empty' }, 'بارگذاری انجام نشد. صفحه را دوباره باز کنید.')); return; }
  const active = list.filter((l) => !l.sold).length;
  sub.textContent = list.length ? fa(active) + ' آگهی فعال' : '';

  /* دکمه‌های نوع (ویلایی/آپارتمان یا ایرانی/خارجی) فقط اگر در آگهی‌ها ثبت شده باشد */
  const kinds = [...new Set(list.map((l) => l.kind).filter(Boolean))];
  let kind = '', q = '', sort = 'new';
  const kbox = document.getElementById('kinds');
  if (kinds.length > 1) {
    const draw = () => kbox.replaceChildren(...['', ...kinds].map((k) =>
      h('button', { type: 'button', class: k === kind ? 'on' : '', onclick: () => { kind = k; draw(); render(); } }, k ? fa(k) : 'همه')));
    draw();
    kbox.hidden = false;
  }
  document.getElementById('q').addEventListener('input', (e) => { q = e.target.value.trim(); render(); });
  document.getElementById('sort').addEventListener('change', (e) => { sort = e.target.value; render(); });

  const norm = (t) => String(t || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
  const num = (p) => (/^\d+$/.test(p || '') ? Number(p) : null);
  function render() {
    let items = list.filter((l) => (!kind || l.kind === kind) &&
      (!q || norm([l.title, l.address, l.kind, (l.specs || []).map((x) => x.value).join(' ')].join(' ')).includes(norm(q))));
    if (sort !== 'new') {
      const dir = sort === 'cheap' ? 1 : -1;
      items = items.slice().sort((a, b) => {
        const x = num(a.price), y = num(b.price);
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        return (x - y) * dir;
      });
    }
    grid.replaceChildren();
    if (!list.length) grid.append(h('div', { class: 'empty' }, 'فعلاً موردی ثبت نشده است. بعداً سر بزنید.'));
    else if (!items.length) grid.append(h('div', { class: 'empty' }, 'موردی با این مشخصات پیدا نشد.'));
    items.forEach((l) => grid.append(listingCard(l, s)));
    reveal(grid);
  }
  render();
})();
