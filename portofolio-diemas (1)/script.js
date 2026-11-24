/* ==========================================================================
   Diemas Arya Komara — portfolio script
   ========================================================================== */

/* ---- Settings you can edit ---------------------------------------------- */

// Your GitHub username. It adds a GitHub link to the Contact section.
const GITHUB_USERNAME = 'diarkomatech';

// Repositories to list under "Code and research on GitHub", in this order,
// e.g. ['ddc-classifier', 'x-comment-crawler']. Only the names you put here are shown,
// so personal repositories never appear by accident. Leave empty to hide the list.
// (simple-references-validator is already shown in "Systems and prototypes".)
const GITHUB_REPOS = [];

/* ------------------------------------------------------------------------- */

(function () {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const lang = () => root.getAttribute('data-lang') || 'en';

  /* ---- Language ---------------------------------------------------------- */
  const langListeners = [];
  $('#langBtn').addEventListener('click', () => {
    const next = lang() === 'en' ? 'id' : 'en';
    root.setAttribute('data-lang', next);
    root.lang = next;
    store.set('lang', next);
    updateCardLabel();
    langListeners.forEach(fn => fn(next));
  });

  /* ---- Header: menu, scrolled state, current section --------------------- */
  const header = $('.site-header');
  const menuBtn = $('.menu-btn');
  const nav = $('#nav');
  menuBtn.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const links = new Map($$('a', nav).map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(a => a.classList.remove('is-current'));
          const a = links.get(e.target.id);
          if (a) a.classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---- Publications: filters and links ----------------------------------- */
  const chips = $$('.filter');
  const refs = $$('#refs > li');
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
    refs.forEach(li => { li.hidden = f !== 'all' && !li.dataset.tags.split(' ').includes(f); });
  }));

  // Link each title: to its DOI if data-doi is filled, otherwise to a Google Scholar search.
  refs.forEach(li => {
    const t = $('.t', li);
    if (!t) return;
    const doi = (li.dataset.doi || '').trim();
    const title = t.textContent.replace(/\.$/, '').trim();
    const a = document.createElement('a');
    a.href = doi ? 'https://doi.org/' + doi : 'https://scholar.google.com/scholar?q=' + encodeURIComponent('"' + title + '"');
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = t.innerHTML;
    t.innerHTML = '';
    t.appendChild(a);
  });

  /* ---- Email (assembled here so simple spam bots cannot read it) --------- */
  const mail = $('#mail');
  if (mail) {
    const addr = mail.dataset.u + '@' + mail.dataset.d;
    mail.href = 'mailto:' + addr;
    mail.textContent = addr;
    // "Request my CV" and "Ask for a demonstration" open an email with the subject filled in.
    $$('[data-subject]').forEach(a => {
      a.href = 'mailto:' + addr + '?subject=' + encodeURIComponent(a.dataset.subject + ' - portfolio');
    });
  }

  /* ---- Barcode on the reader's card -------------------------------------- */
  (function drawBarcode() {
    const svg = $('#barcode');
    if (!svg) return;
    const seed = 'DIEMAS ARYA KOMARA 020.92';
    let x = 2, out = '';
    for (let i = 0; i < seed.length && x < 156; i++) {
      const c = seed.charCodeAt(i);
      for (let b = 0; b < 3 && x < 156; b++) {
        const w = 1 + ((c >> b) & 1) + ((c >> (b + 3)) & 1);
        out += `<rect x="${x}" y="0" width="${w}" height="28"/>`;
        x += w + 1 + ((c >> (b + 1)) & 1);
      }
    }
    svg.innerHTML = out;
  })();

  /* ---- Lanyard: a verlet rope with the card hanging from its end ---------- */
  const hero = $('.hero');
  const stage = $('#stage');
  const canvas = $('#strap');
  const card = $('#card');
  const inner = $('#cardInner');
  const hint = $('#stageHint');
  const ctx = canvas.getContext('2d');

  function updateCardLabel() {
    card.setAttribute('aria-label', lang() === 'id'
      ? 'Kartu anggota perpustakaan Diemas Arya Komara. Tekan untuk membalik.'
      : "Reader's card for Diemas Arya Komara. Press to turn it over.");
  }
  updateCardLabel();

  const N = 14;
  const GRAVITY = 2200;     // px / s^2
  const DAMPING = 0.982;
  const STEP = 1 / 60;
  let pts = [], seg = 20, ropeLen = 280, anchor = { x: 0, y: -8 };
  let W = 0, H = 0, dpr = 1, cardW = 236, cardH = 372;
  let dragging = false, pointerId = null, target = null, grabOffset = { x: 0, y: 0 };
  let downAt = null, moved = false;
  let angle = 0, tilt = 0, flip = 0, flipTarget = 0;
  let running = false, visible = true, calmFrames = 0, lastT = 0, acc = 0;

  // Everything is measured in hero coordinates, so the strap can follow the card anywhere in the hero.
  function measure() {
    const h = hero.getBoundingClientRect(), s = stage.getBoundingClientRect();
    W = h.width; H = h.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    cardW = card.offsetWidth; cardH = card.offsetHeight;
    const stageTop = s.top - h.top;
    anchor = { x: s.left - h.left + s.width * 0.5, y: stageTop - 8 };
    ropeLen = Math.max(70, Math.min(s.height - cardH - 84, s.height * 0.42));
    seg = ropeLen / (N - 1);
  }

  function initRope(dropIn) {
    pts = [];
    const a = dropIn ? (62 * Math.PI) / 180 : 0;  // start swung out to the side, then fall
    for (let i = 0; i < N; i++) {
      const x = anchor.x - Math.sin(a) * seg * i;
      const y = anchor.y + Math.cos(a) * seg * i;
      pts.push({ x, y, px: x, py: y, w: i === 0 ? 0 : (i === N - 1 ? 0.35 : 1) });
    }
    angle = dropIn ? 40 : 0;
  }

  function settle(steps) { for (let i = 0; i < steps; i++) physics(); }

  function physics() {
    const g = GRAVITY * STEP * STEP;
    for (let i = 1; i < N; i++) {
      const p = pts[i];
      if (dragging && i === N - 1) continue;
      const vx = (p.x - p.px) * DAMPING, vy = (p.y - p.py) * DAMPING;
      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy + g;
    }
    if (dragging && target) {
      const last = pts[N - 1];
      let tx = target.x, ty = target.y;
      const dx = tx - anchor.x, dy = ty - anchor.y, d = Math.hypot(dx, dy), max = ropeLen * 1.06;
      if (d > max) { tx = anchor.x + dx / d * max; ty = anchor.y + dy / d * max; }
      last.px = last.x; last.py = last.y;
      last.x = tx; last.y = ty;
    }
    const lastW = dragging ? 0 : 0.35;
    pts[N - 1].w = lastW;
    for (let k = 0; k < 14; k++) {
      pts[0].x = anchor.x; pts[0].y = anchor.y;
      for (let i = 0; i < N - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.0001;
        if (d <= seg) continue;                       // a strap only pulls, it never pushes
        const sum = a.w + b.w; if (!sum) continue;
        const diff = (d - seg) / d;
        a.x += dx * diff * (a.w / sum); a.y += dy * diff * (a.w / sum);
        b.x -= dx * diff * (b.w / sum); b.y -= dy * diff * (b.w / sum);
      }
    }
  }

  function render() {
    const last = pts[N - 1], ref = pts[N - 3];
    // Card angle follows the end of the strap; tilt follows sideways speed for depth.
    const targetAngle = -Math.atan2(last.x - ref.x, last.y - ref.y) * 180 / Math.PI;
    angle += (targetAngle - angle) * 0.3;
    const vx = last.x - last.px;
    tilt += (Math.max(-28, Math.min(28, vx * 2.4)) - tilt) * 0.2;
    if (reduceMotion) { flip = flipTarget; tilt = 0; } else { flip += (flipTarget - flip) * 0.14; }

    card.style.transform = `translate3d(${last.x - cardW / 2}px, ${last.y + 12}px, 0) rotate(${angle.toFixed(2)}deg)`;
    inner.style.transform = `rotateY(${(flip + tilt).toFixed(2)}deg)`;

    // Strap
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const width = cardW > 220 ? 15 : 13;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < N - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(last.x, last.y);
    };
    ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = '#163b6e'; ctx.lineWidth = width + 2; ctx.stroke();
    path(); ctx.strokeStyle = '#1e4f91'; ctx.lineWidth = width; ctx.stroke();
    path(); ctx.strokeStyle = '#c9daf3'; ctx.lineWidth = 2.5; ctx.stroke();

    // Energy check so the loop can rest when nothing moves.
    let e = 0;
    for (let i = 1; i < N; i++) e += Math.abs(pts[i].x - pts[i].px) + Math.abs(pts[i].y - pts[i].py);
    e += Math.abs(flipTarget - flip) + Math.abs(targetAngle - angle);
    calmFrames = (!dragging && e < 0.05) ? calmFrames + 1 : 0;
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - (lastT || t)) / 1000);
    lastT = t; acc += dt;
    while (acc >= STEP) { physics(); acc -= STEP; }
    render();
    if (calmFrames > 90 || !visible) { running = false; return; }
    requestAnimationFrame(frame);
  }

  function wake() {
    if (running || !visible) return;
    running = true; calmFrames = 0; lastT = 0; acc = 0;
    requestAnimationFrame(frame);
  }

  function toLocal(e) {
    const r = hero.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  card.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    card.setPointerCapture(pointerId);
    const p = toLocal(e), last = pts[N - 1];
    grabOffset = { x: p.x - last.x, y: p.y - last.y };
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    moved = false;
    target = { x: last.x, y: last.y };
    e.preventDefault();
  });

  card.addEventListener('pointermove', e => {
    if (e.pointerId !== pointerId || !downAt) return;
    if (!moved && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) {
      moved = true; dragging = true; card.classList.add('is-dragging');
      hint.classList.add('is-hidden');
    }
    if (dragging) {
      const p = toLocal(e);
      target = { x: p.x - grabOffset.x, y: p.y - grabOffset.y };
      wake();
    }
  });

  const release = e => {
    if (e.pointerId !== pointerId) return;
    if (!moved && downAt) toggleFlip();
    dragging = false; target = null; downAt = null; pointerId = null;
    card.classList.remove('is-dragging');
    wake();
  };
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);

  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlip(); }
  });

  function toggleFlip() {
    flipTarget = flipTarget === 0 ? 180 : 0;
    card.setAttribute('aria-pressed', String(flipTarget === 180));
    hint.classList.add('is-hidden');
    if (!reduceMotion) { const last = pts[N - 1]; last.px -= 6; }  // a small swing as it turns
    wake();
  }

  function setup(dropIn) {
    measure();
    initRope(dropIn);
    if (!dropIn) settle(240);
    render();
    wake();
  }

  setup(!reduceMotion);
  // Web fonts can change the hero's size after first paint; re-measure without restarting the swing.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); wake(); });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => setup(false), 120);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) wake();
    }).observe(hero);
  }

  /* ---- GitHub repositories ------------------------------------------------ */
  const T = {
    en: { updated: 'Updated', demo: 'Live demo', none: 'No description yet.' },
    id: { updated: 'Diperbarui', demo: 'Demo langsung', none: 'Belum ada deskripsi.' }
  };
  let repoData = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderRepos() {
    if (!repoData) return;
    const L = T[lang()] || T.en;
    const fmt = new Intl.DateTimeFormat(lang() === 'id' ? 'id-ID' : 'en-GB', { month: 'short', year: 'numeric' });
    $('#repoList').innerHTML = repoData.map(r => `
      <li class="row">
        <p class="meta">${esc(r.language || '')}</p>
        <div>
          <h4><a href="${esc(r.html_url)}" target="_blank" rel="noopener">${esc(r.name)}</a></h4>
          <p>${esc(r.description || L.none)} ${L.updated} ${fmt.format(new Date(r.pushed_at))}.${r.homepage ? ` <a href="${esc(r.homepage)}" target="_blank" rel="noopener">${L.demo}</a>` : ''}</p>
        </div>
      </li>`).join('');
  }

  if (GITHUB_USERNAME) {
    const u = GITHUB_USERNAME.trim();
    const profile = 'https://github.com/' + encodeURIComponent(u);
    $('#ghContact').hidden = false;
    $('#ghContactLink').href = profile;
    $('#ghContactLink').textContent = 'github.com/' + u;

    if (GITHUB_REPOS.length) {
      fetch('https://api.github.com/users/' + encodeURIComponent(u) + '/repos?per_page=100')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(list => {
          repoData = GITHUB_REPOS
            .map(n => list.find(r => r.name.toLowerCase() === String(n).toLowerCase()))
            .filter(Boolean);
          if (repoData.length) { renderRepos(); $('#repos').hidden = false; }
        })
        .catch(() => { /* GitHub unreachable: keep the list hidden */ });
      langListeners.push(renderRepos);
    }
  }
})();
