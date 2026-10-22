'use strict';
(async () => {
  const hero = document.getElementById('hero');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CYCLE = 6000;

  /* ورود نرم بعد از آماده شدن عکس جلو */
  const firstImgs = [...hero.querySelectorAll('.shot.front img')];
  Promise.race([
    Promise.all(firstImgs.map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; })))),
    new Promise((r) => setTimeout(r, 1200))
  ]).then(() => requestAnimationFrame(() => hero.classList.add('ready')));

  /* جابه‌جایی دو عکس هر نیمه (املاک: ویلا/آپارتمان — خودرو: سورن/BMW) */
  function cycle(panel, offset) {
    const shots = [...panel.querySelectorAll('.shot')];
    const amb = [...panel.querySelectorAll('.amb img')];
    const dots = [...panel.querySelectorAll('.dots span')];
    let i = 0;
    dots[0].style.setProperty('--cycle', CYCLE + offset + 'ms');
    const step = () => {
      if (document.hidden) return;
      i = 1 - i;
      shots.forEach((s, k) => { s.classList.toggle('front', k === i); s.classList.toggle('back', k !== i); });
      amb.forEach((a, k) => a.classList.toggle('on', k === i));
      dots.forEach((d, k) => { d.classList.remove('on'); d.style.setProperty('--cycle', CYCLE + 'ms'); void d.offsetWidth; d.classList.toggle('on', k === i); });
    };
    setTimeout(() => { step(); setInterval(step, CYCLE); }, CYCLE + offset);
  }
  if (!calm) {
    const panels = hero.querySelectorAll('.side');
    panels.forEach((p, k) => cycle(p, k * (CYCLE / 2)));

    /* حرکت ملایم با موس (فقط دسکتاپ) */
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      panels.forEach((p) => {
        p.addEventListener('pointermove', (e) => {
          const r = p.getBoundingClientRect();
          p.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
          p.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        });
        p.addEventListener('pointerleave', () => { p.style.setProperty('--mx', 0); p.style.setProperty('--my', 0); });
      });
    }
  }

  const [s, list] = await Promise.all([
    getSettings(),
    fetch('/api/listings').then((r) => (r.ok ? r.json() : [])).catch(() => [])
  ]);
  applyBrand(s);
  renderFooter(s);

  for (const cat of ['property', 'car']) {
    const n = s.counts ? s.counts[cat] : 0;
    const el = hero.querySelector('[data-count="' + cat + '"]');
    if (n) el.append(h('b', null, fa(n)), ' آگهی فعال');
    else el.remove();
    /* اگر در پنل مدیریت عکس کاور گذاشته شده باشد، جای عکس اول می‌نشیند */
    const cover = s.covers && s.covers[cat];
    if (cover) {
      const p = hero.querySelector('.side.' + cat);
      const im = p.querySelector('.shot.a img');
      im.removeAttribute('srcset'); im.src = cover;
      p.querySelector('.amb img').src = cover;
    }
  }

  const latest = (list || []).filter((l) => !l.sold).slice(0, 6);
  if (latest.length) {
    const grid = document.getElementById('latestGrid');
    latest.forEach((l) => grid.append(listingCard(l, s, { showCat: true })));
    document.getElementById('latest').hidden = false;
    reveal(grid);
  }
})();
