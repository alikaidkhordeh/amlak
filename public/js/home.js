'use strict';
(async () => {
  const s = await getSettings();
  applyBrand(s);
  if (s.tagline) { const t = document.getElementById('tagline'); t.textContent = s.tagline; t.hidden = false; }

  const tiles = document.getElementById('tiles');
  for (const cat of ['property', 'car']) {
    const cover = s.covers && s.covers[cat];
    const n = s.counts ? s.counts[cat] : 0;
    const bg = h('div', { class: 'bg' });
    if (cover) bg.append(h('img', { class: 'cover', src: cover, alt: '', loading: 'eager', decoding: 'async' }));
    else { const art = h('div', { class: 'art' }); art.append(svgEl(ART[cat])); bg.append(art); }
    tiles.append(h('a', { class: 'tile ' + cat, href: '/c/' + cat },
      bg,
      h('div', { class: 'txt' },
        h('h2', null, CAT_NAME[cat]),
        h('p', { class: 'count' }, n ? fa(n) + ' مورد موجود' : 'موجودی در دسترس نیست'),
        (() => { const g = h('span', { class: 'go' }, 'مشاهده موجودی '); g.append(svgEl(CHEVRON)); return g; })()
      )));
  }

  const links = contactLinks(s, 'chip');
  if (links.length) {
    document.getElementById('contacts').append(...links);
    document.getElementById('foot').hidden = false;
  }
})();
