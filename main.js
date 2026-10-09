(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- menu ---- */
  const burger = $('#burger'), nav = $('#nav');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    nav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---- services accordion ---- */
  $$('.svc button').forEach(btn => btn.addEventListener('click', () => {
    const li = btn.closest('.svc');
    const open = !li.classList.contains('open');
    $$('.svc.open').forEach(o => { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
    if (open) { li.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
  }));

  /* ---- before / after ---- */
  const cmp = $('#compare'), range = $('#cmp-range');
  const setPos = v => {
    v = clamp(v, 0, 100);
    cmp.style.setProperty('--pos', v + '%');
    range.value = v;
  };
  const fromEvent = e => { const r = cmp.getBoundingClientRect(); setPos((e.clientX - r.left) / r.width * 100); };
  let dragging = false;
  cmp.addEventListener('pointerdown', e => { dragging = true; cmp.setPointerCapture(e.pointerId); fromEvent(e); });
  cmp.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
  ['pointerup', 'pointercancel'].forEach(t => cmp.addEventListener(t, () => dragging = false));
  range.addEventListener('input', () => setPos(+range.value));
  // a first nudge so people see it is movable
  if (!reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en], ob) => {
      if (!en.isIntersecting) return;
      ob.disconnect();
      const t0 = performance.now();
      const step = t => {
        const k = (t - t0) / 1600;
        if (dragging || k >= 1) return;
        setPos(50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k));
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .6 }).observe(cmp);
  }

  /* ---- form: composes an email to Mira ---- */
  const form = $('#form'), status = $('#form-status');
  form.addEventListener('submit', e => {
    e.preventDefault();
    status.classList.remove('err');
    if (!form.checkValidity()) {
      status.classList.add('err');
      status.textContent = 'Add your name, a valid email and a line about the place or date.';
      form.querySelector(':invalid').focus();
      return;
    }
    const d = new FormData(form);
    const body = `${d.get('msg')}\n\n${d.get('name')}\n${d.get('email')}`;
    const href = `mailto:hello@mirasol.studio?subject=${encodeURIComponent('Booking: ' + d.get('kind'))}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Opening your email app with the message ready. Press send there and Mira will reply within two days.';
    location.href = href;
  });

  /* ---- scroll scenes ---- */
  const hero = $('#hero'), stick = $('.hero-stick', hero), iris = $('#iris');
  const ha = $('#ht-a'), hb = $('#ht-b');
  const reel = $('#work'), rstick = $('.reel-stick', reel), track = $('#track');
  const frames = $$('[data-frame]');
  const parImgs = $$('[data-par]').filter(i => !i.closest('[data-frame]'));
  const about = $('#about-photo');
  let vw = innerWidth, vh = innerHeight, travel = 0, pinned = false;

  const measure = () => {
    vw = innerWidth; vh = innerHeight;
    pinned = !reduce;
    reel.classList.toggle('pinned', pinned);
    document.documentElement.classList.toggle('pinned', pinned);
    if (pinned) {
      track.style.transform = '';
      travel = Math.max(0, track.scrollWidth - vw);
      reel.style.height = (travel + vh) + 'px';
    } else {
      reel.style.height = '';
    }
  };

  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY;
    const top = hero.offsetTop;

    // hero: the circle opens from sun-size to the whole frame
    const hp = clamp((y - top) / (hero.offsetHeight - vh));
    const open = ease(clamp(hp / .78));
    const phone = vw < 780;
    const r0 = Math.min(vw, vh) * (phone ? .26 : .24);
    const r1 = Math.hypot(vw, vh) * .55;
    if (!reduce) {
      stick.style.setProperty('--r', (r0 + (r1 - r0) * open).toFixed(1) + 'px');
      // start with the sun of the photograph inside the circle, ease out to the whole frame
      const k = Math.max(vw / 1400, vh / 834), iw = 1400 * k, ih = 834 * k;
      const sx = (vw - iw) * .5 + iw * .72, sy = (vh - ih) * .45 + ih * .26;
      const L = (vw - iw) * .5, T = (vh - ih) * .45;
      stick.style.setProperty('--iw', iw + 'px'); stick.style.setProperty('--ih', ih + 'px');
      stick.style.setProperty('--il', L + 'px'); stick.style.setProperty('--it', T + 'px');
      stick.style.setProperty('--ox', (sx - L) + 'px'); stick.style.setProperty('--oy', (sy - T) + 'px');
      const sc = 1 + (phone ? .9 : .6) * (1 - open);
      const fit = (want, o, lo, size, view) => clamp(want, view - (o + (lo + size - o) * sc), -(o + (lo - o) * sc));
      stick.style.setProperty('--tx', fit((vw / 2 - sx) * (1 - open), sx, L, iw, vw).toFixed(1) + 'px');
      stick.style.setProperty('--ty', fit((vh * .54 - sy) * (1 - open), sy, T, ih, vh).toFixed(1) + 'px');
      stick.style.setProperty('--s', sc.toFixed(3));
      const w = (phone ? 62 : 58) + (phone ? 28 : 42) * open;
      stick.style.setProperty('--w', w.toFixed(1));
      stick.style.setProperty('--hint', (1 - clamp(hp / .06)).toFixed(2));
      stick.style.setProperty('--lead', clamp((hp - .5) / .25).toFixed(2));
      stick.style.setProperty('--shade', (.55 + .45 * open).toFixed(2));
    } else {
      stick.style.setProperty('--lead', 1);
      stick.style.setProperty('--hint', 0);
    }

    // reel
    if (pinned) {
      const rp = clamp((y - reel.offsetTop) / Math.max(1, reel.offsetHeight - vh));
      track.style.transform = `translate3d(${(-rp * travel).toFixed(1)}px,0,0)`;
      rstick.style.setProperty('--m', rp.toFixed(4));
      const near = y > reel.offsetTop - vh && y < reel.offsetTop + reel.offsetHeight;
      if (near) frames.forEach(f => {
        const r = f.getBoundingClientRect();
        const d = clamp(((r.left + r.width / 2) - vw / 2) / vw, -1.2, 1.2);
        f.style.transform = `perspective(1500px) rotateY(${(-d * 26).toFixed(2)}deg) translateZ(${(-Math.abs(d) * 140).toFixed(1)}px)`;
        f.style.setProperty('--px', (clamp(d, -1, 1) * -7).toFixed(2) + '%');
      });
    }

    // about reveal + vertical parallax
    const ar = about.getBoundingClientRect();
    about.style.setProperty('--rv', ease(clamp((vh - ar.top) / (vh * .8))).toFixed(3));
    parImgs.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const c = (r.top + r.height / 2 - vh / 2) / vh;
      img.parentElement.style.setProperty('--py', (-c * r.height * .12).toFixed(1) + 'px');
      img.style.setProperty('--py', (-c * r.height * .12).toFixed(1) + 'px');
    });
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };

  measure(); frame();
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { measure(); req(); });
  addEventListener('load', () => { measure(); req(); });
  if (document.fonts) document.fonts.ready.then(() => { measure(); req(); });
})();
