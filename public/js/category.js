'use strict';
(async () => {
  const cat = location.pathname.split('/')[2] === 'car' ? 'car' : 'property';
  const back = document.getElementById('back');
  back.prepend(svgEl(CHEVRON.replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7')));
  document.getElementById('title').textContent = 'موجودی ' + CAT_NAME[cat];

  const [s, list] = await Promise.all([
    getSettings(),
    fetch('/api/listings?category=' + cat).then((r) => r.json()).catch(() => null)
  ]);
  applyBrand(s);
  document.title = 'موجودی ' + CAT_NAME[cat] + (s.siteName ? ' | ' + s.siteName : '');

  const grid = document.getElementById('grid');
  const sub = document.getElementById('sub');
  if (!list) { grid.append(h('div', { class: 'empty', style: 'grid-column:1/-1' }, 'بارگذاری انجام نشد. صفحه را دوباره باز کنید.')); return; }
  if (!list.length) {
    sub.textContent = '';
    grid.append(h('div', { class: 'empty', style: 'grid-column:1/-1' }, 'فعلاً موردی ثبت نشده است. بعداً سر بزنید.'));
  } else {
    sub.textContent = fa(list.length) + ' مورد';
  }

  for (const l of list || []) {
    const thumb = h('div', { class: 'thumb' });
    if (l.cover) thumb.append(h('img', { src: l.cover, alt: '', loading: 'lazy', decoding: 'async' }));
    else { const ph = h('div', { class: 'ph' }); ph.append(svgEl(ART[l.category])); thumb.append(ph); }
    if (l.hasVideo) thumb.append(h('span', { class: 'badge' }, 'ویدیو'));
    if (l.sold) thumb.append(h('span', { class: 'badge sold' }, 'فروخته شد'));
    const pr = shortPrice(l.price, s.currency);
    grid.append(h('a', { class: 'card' + (l.sold ? ' is-sold' : ''), href: '/l/' + l.id },
      thumb,
      h('div', { class: 'body' },
        h('h3', null, fa(l.title)),
        pr ? h('div', { class: 'price' }, pr) : null,
        l.address ? h('div', { class: 'addr' }, fa(l.address)) : null,
        l.createdAt ? h('div', { class: 'date' }, 'تاریخ انتشار: ' + jdate(l.createdAt)) : null)));
  }

  const links = contactLinks(s, 'chip');
  if (links.length) { document.getElementById('contacts').append(...links); document.getElementById('foot').hidden = false; }
})();
