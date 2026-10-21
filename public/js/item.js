'use strict';
(async () => {
  const id = location.pathname.split('/')[2];
  const root = document.getElementById('root');
  const [s, l] = await Promise.all([
    getSettings(),
    fetch('/api/listings/' + encodeURIComponent(id)).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  ]);
  applyBrand(s);
  const back = document.getElementById('back');
  back.prepend(svgEl(CHEVRON.replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7')));
  if (!l) { root.append(h('div', { class: 'empty' }, 'این مورد پیدا نشد یا حذف شده است.')); return; }
  back.href = '/c/' + l.category;
  back.append(' موجودی ' + CAT_NAME[l.category]);

  const grid = h('div', { class: 'item-grid' });

  /* ---- گالری (فقط اگر عکس یا ویدیو ثبت شده باشد) ---- */
  const media = l.media || [];
  if (media.length) {
    const track = h('div', { class: 'track', tabindex: '0', 'aria-label': 'تصاویر' });
    const slides = media.map((m, i) => {
      const el = m.type === 'image'
        ? h('img', { src: m.url, alt: l.title, loading: i ? 'lazy' : 'eager', decoding: 'async', onclick: () => openLightbox(m.url) })
        : h('video', { src: m.url, controls: true, playsinline: true, preload: 'metadata' });
      const sl = h('div', { class: 'slide' }, el);
      track.append(sl);
      return sl;
    });
    const viewer = h('div', { class: 'viewer' }, track);
    const counter = h('span', { class: 'counter' });
    const thumbsBar = h('div', { class: 'thumbs' });
    const thumbBtns = media.map((m, i) => {
      const b = h('button', { type: 'button', 'aria-label': 'نمایش مورد ' + fa(i + 1), onclick: () => go(i) },
        m.type === 'image' ? h('img', { src: m.url, alt: '', loading: 'lazy' })
          : (() => { const d = h('span', { class: 'vid' }); d.append(svgEl('<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>')); return d; })());
      thumbsBar.append(b);
      return b;
    });
    let cur = 0;
    function mark(i) {
      cur = i;
      counter.textContent = fa(i + 1) + ' از ' + fa(media.length);
      thumbBtns.forEach((b, k) => b.classList.toggle('on', k === i));
      thumbBtns[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function go(i) {
      i = (i + media.length) % media.length;
      slides[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      mark(i);
    }
    let t;
    track.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const w = track.clientWidth || 1;
        const i = Math.min(media.length - 1, Math.max(0, Math.round(Math.abs(track.scrollLeft) / w)));
        if (i !== cur) { slides.forEach((sl) => { const v = sl.querySelector('video'); if (v) v.pause(); }); mark(i); }
      }, 60);
    }, { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') go(cur + 1);
      if (e.key === 'ArrowRight') go(cur - 1);
    });
    if (media.length > 1) {
      const mkBtn = (cls, label, path, fn) => {
        const b = h('button', { type: 'button', class: 'vbtn ' + cls, 'aria-label': label, onclick: fn });
        b.append(svgEl('<svg viewBox="0 0 24 24"><path d="' + path + '"/></svg>'));
        return b;
      };
      viewer.append(mkBtn('prev', 'قبلی', 'M9 5l7 7-7 7', () => go(cur - 1)), mkBtn('next', 'بعدی', 'M15 5l-7 7 7 7', () => go(cur + 1)), counter);
    }
    mark(0);
    grid.append(h('section', { class: 'gal' }, viewer, media.length > 1 ? thumbsBar : null));
  }

  /* ---- کادر اطلاعات اصلی ---- */
  const p = priceParts(l.price, s.currency);
  const info = h('aside', { class: 'info' },
    h('h1', { class: 'item-title' }, fa(l.title)),
    h('div', { class: 'meta' },
      h('span', { class: 'pill' }, CAT_NAME[l.category]),
      l.sold ? h('span', { class: 'pill sold' }, 'فروخته شد') : null,
      l.createdAt ? h('span', null, 'تاریخ انتشار: ' + jdate(l.createdAt)) : null),
    p ? h('div', { class: 'price-box' },
      h('div', { class: 'price-big' }, p.text, p.cur ? h('small', null, p.cur) : null),
      p.words ? h('div', { class: 'price-words' }, p.words + (p.cur ? ' ' + p.cur : '')) : null) : null,
    l.address ? (() => {
      const a = h('p', { class: 'addr-line' });
      a.append(svgEl('<svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'), h('span', null, fa(l.address)));
      return a;
    })() : null);
  const actions = h('div', { class: 'actions' });
  if (s.phone) actions.append(h('a', { class: 'btn', href: 'tel:' + s.phone.replace(/[^\d+]/g, '') }, 'تماس: ' + fa(s.phone)));
  const w = waLink(s.whatsapp);
  if (w) actions.append(h('a', { class: 'btn wa', href: w + '?text=' + encodeURIComponent('سلام، درباره «' + l.title + '» سؤال داشتم'), target: '_blank', rel: 'noopener' }, 'پیام در واتساپ'));
  actions.append(h('button', {
    type: 'button', class: 'btn ghost', onclick: async (e) => {
      const btn = e.currentTarget;
      try {
        if (navigator.share) await navigator.share({ title: l.title, url: location.href });
        else { await navigator.clipboard.writeText(location.href); btn.textContent = 'لینک کپی شد'; setTimeout(() => (btn.textContent = 'اشتراک‌گذاری'), 1800); }
      } catch (_) { /* انصراف کاربر */ }
    }
  }, 'اشتراک‌گذاری'));
  info.append(actions);

  /* ---- جزئیات: فقط بخش‌هایی که پر شده‌اند ---- */
  const det = h('div', { class: 'det' });
  if (l.description) det.append(h('section', { class: 'sec' }, h('h2', null, 'توضیحات'), h('p', { class: 'desc' }, fa(l.description))));
  if ((l.fields || []).length) {
    const dl = h('dl', { class: 'spec' });
    l.fields.forEach((f) => dl.append(h('div', null, h('dt', null, f.label), h('dd', null, fa(f.value)))));
    det.append(h('section', { class: 'sec' }, h('h2', null, 'مشخصات'), dl));
  }
  if ((l.qa || []).length) {
    const box = h('div');
    l.qa.forEach((x) => box.append(h('details', { class: 'qa' }, h('summary', null, x.q), h('p', null, fa(x.a)))));
    det.append(h('section', { class: 'sec' }, h('h2', null, 'پرسش‌ها'), box));
  }
  grid.append(info, det);
  if (!det.children.length) det.remove();
  root.append(grid);

  const links = contactLinks(s, 'chip');
  if (links.length) { document.getElementById('contacts').append(...links); document.getElementById('foot').hidden = false; }

  function openLightbox(src) {
    const close = () => { lb.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const lb = h('div', { class: 'lb', role: 'dialog', 'aria-label': 'نمایش تصویر', onclick: close },
      h('img', { src, alt: '' }), h('button', { type: 'button', 'aria-label': 'بستن', onclick: close }, '×'));
    document.addEventListener('keydown', onKey);
    document.body.append(lb);
  }
})();
