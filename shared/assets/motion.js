// One clock for every motion specimen in a section (design-motion).
//
// In a specimen page (a board page shown in an iframe), after building the animation:
//   dhMotion.gsap(timeline, { track: ['h2', '.card'] })      // a GSAP timeline
//   dhMotion.motion(controls, { track: ['.card'] })          // what Motion's animate() returned
//   dhMotion.custom({ duration: () => s, seek: (s) => {} }, { track: [...] })
//   dhMotion.journey(build, { track, scroller, speed, pause })   // scroll-linked GSAP
// journey: a scroll-linked moment (ScrollTrigger) has no clock of its own, so the scroll
// becomes one. The page scrolls a fixed path (down to the bottom, up to the top, down again)
// at `speed` px/s with `pause` ms between legs, and GSAP's own clock is driven by hand, so
// any moment of the path replays exactly. `build()` creates the animations and returns
// nothing or a cleanup function; going back in time rebuilds from the top.
// Each wraps the animation in the same two-call connector, pauses it at its end state (so
// a page opened alone, or screenshotted, shows the finished layout), and marks it ready. `track` names the elements motion.cjs measures. `dhMotion.reduced` is true when
// the page should draw its reduced-motion variant (prefers-reduced-motion, or "reduced" in
// the hash, so a sheet can show it beside the full one).
//
// In the sheet, put <div class="dh-play" data-for="r3-1"></div> above the section's grid.
// This file fills it with the play bar: 전체 재생, 1배, 0.5배, 0.25배, 반복 and a scrubber.
// Every iframe in that section is driven by seeking it to the same time on every frame, so
// specimens never drift apart, and slowing down keeps their differences. The sheet starts
// at the end state and plays once when every specimen is ready, except in an automated
// browser (navigator.webdriver), where it stays at the end so checks see a stable page.
(() => {
  const api = window.dhMotion = window.dhMotion || {};
  api.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || /reduced/.test(location.hash);

  const connect = (c, opts = {}) => {
    api.duration = c.duration;
    api.seek = c.seek;
    api.track = opts.track || [];
    api.seek(api.duration());
    api.ready = true;
    return api;
  };
  api.gsap = (tl, opts) => {
    tl.pause();
    return connect({ duration: () => tl.duration(), seek: (s) => { tl.time(Math.min(s, tl.duration()), false); } }, opts);
  };
  api.motion = (controls, opts) => {
    controls.pause();
    const dur = () => {
      const d = Number(controls.duration);
      return Number.isFinite(d) && d > 0 ? d : (opts && opts.duration) || 1;
    };
    return connect({ duration: dur, seek: (s) => { controls.time = Math.min(s, dur()); } }, opts);
  };
  api.custom = (c, opts) => connect(c, opts);

  api.journey = (build, opts = {}) => {
    const g = window.gsap, ST = window.ScrollTrigger;
    const sc = opts.scroller ? document.querySelector(opts.scroller) : document.scrollingElement;
    const speed = opts.speed || 1000, pause = (opts.pause || 400) / 1000;
    g.ticker.remove(g.updateRoot);
    g.ticker.lagSmoothing(0);
    let root = 1, now = 0, cleanup = null, max = 0, legs = [];
    const reset = () => {
      if (typeof cleanup === 'function') cleanup();
      if (ST) ST.getAll().forEach(t => t.kill(true));
      g.globalTimeline.getChildren().forEach(c => c.kill());
      sc.scrollTop = 0;
      root += 1000;
      g.updateRoot(root);
      cleanup = build();
      if (ST) ST.refresh();
      max = sc.scrollHeight - sc.clientHeight;
      const run = max / speed;
      legs = [0, run, run + pause, 2 * run + pause, 2 * run + 2 * pause, 3 * run + 2 * pause];
      now = 0;
    };
    const yAt = (t) => {
      const [, a, b, c, d, e] = legs, run = a || 1;
      if (t <= a) return (t / run) * max;
      if (t <= b) return max;
      if (t <= c) return max - ((t - b) / run) * max;
      if (t <= d) return 0;
      return t <= e ? ((t - d) / run) * max : max;
    };
    const step = (to) => {
      for (let t = now; t <= to + 1e-9; t += 0.01) {
        sc.scrollTop = yAt(t);
        if (ST) ST.update();
        g.updateRoot(root + t);
      }
      sc.scrollTop = yAt(to);
      if (ST) ST.update();
      g.updateRoot(root + to);
      now = to;
    };
    reset();
    api.scroll = { scroller: opts.scroller || null, legs: () => legs.map(v => Math.round(v * 1000)), max: () => max };
    return connect({ duration: () => legs[5], seek: (s) => { if (s < now - 1e-9) reset(); step(s); } }, opts);
  };

  // ---- sheet side --------------------------------------------------------------------
  const CSS = `.dh-play{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;flex-wrap:wrap;
    margin:0 0 18px;padding:10px 14px;background:var(--dh-surface,#fff);border-radius:12px;
    box-shadow:var(--dh-float,0 1px 2px rgba(0,0,0,.05),0 6px 20px rgba(0,0,0,.06));max-width:880px;font-size:12.5px}
  .dh-play button{height:30px;padding:0 12px;border:1px solid #d4d4d8;border-radius:8px;background:#fff;
    font:600 12.5px inherit;cursor:pointer;color:var(--dh-ink,#1f1f23)}
  .dh-play button.dh-on{background:var(--dh-accent,#3b5bdb);border-color:var(--dh-accent,#3b5bdb);color:#fff}
  .dh-play input{flex:1;min-width:180px}
  .dh-play output{font:600 12.5px ui-monospace,monospace;min-width:104px;text-align:right}
  .dh-play .dh-wait{color:var(--dh-muted,#8b8b93)}`;

  function bar(el) {
    const section = document.getElementById(el.dataset.for);
    if (!section) return;
    el.innerHTML = '<span class="dh-wait">시안을 불러오는 중입니다</span>';
    const frames = [...section.querySelectorAll('iframe')];
    const started = Date.now();
    const wait = setInterval(() => {
      const ready = frames.map(f => { try { return f.contentWindow.dhMotion; } catch { return null; } })
        .filter(m => m && m.ready);
      if (ready.length === frames.length && frames.length) { clearInterval(wait); run(el, ready); }
      else if (Date.now() - started > 15000) {
        clearInterval(wait);
        el.innerHTML = `<span class="dh-wait">시안 ${frames.length}개 중 ${ready.length}개만 준비됐습니다.</span>`;
        if (ready.length) run(el, ready);
      }
    }, 100);
  }

  function run(el, specs) {
    const max = Math.max(...specs.map(m => m.duration()));
    el.innerHTML = '<button data-act="play">전체 재생</button><button data-speed="1" class="dh-on">1배</button>' +
      '<button data-speed="0.5">0.5배</button><button data-speed="0.25">0.25배</button>' +
      '<button data-act="loop">반복</button>' +
      `<input type="range" min="0" max="${Math.round(max * 1000)}" value="0" aria-label="재생 위치"><output></output>`;
    const range = el.querySelector('input'), out = el.querySelector('output');
    let t = max, speed = 1, playing = false, loop = false, last = 0, holdUntil = 0, touched = false;
    const show = () => {
      specs.forEach(m => m.seek(Math.min(t, m.duration())));
      range.value = Math.round(t * 1000);
      out.textContent = `${Math.round(t * 1000)} / ${Math.round(max * 1000)}ms`;
    };
    const tick = (now) => {
      if (playing) {
        if (holdUntil) { if (now >= holdUntil) { holdUntil = 0; t = 0; last = now; } }
        else {
          t += ((now - last) / 1000) * speed; last = now;
          if (t >= max) { t = max; if (loop) holdUntil = now + 600; else playing = false; }
        }
        show();
      }
      requestAnimationFrame(tick);
    };
    const play = () => { t = 0; playing = true; holdUntil = 0; last = performance.now(); };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      touched = true;
      if (b.dataset.act === 'play') play();
      if (b.dataset.act === 'loop') { loop = !loop; b.classList.toggle('dh-on', loop); if (loop && !playing) play(); }
      if (b.dataset.speed) {
        speed = Number(b.dataset.speed);
        el.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('dh-on', x === b));
        play();
      }
    });
    range.addEventListener('input', () => { touched = true; playing = false; t = range.value / 1000; show(); });
    show();
    requestAnimationFrame(tick);
    if (!navigator.webdriver) setTimeout(() => { if (!touched) play(); }, 500);   // the first play, unless the person already took over
  }

  const init = () => {
    const bars = document.querySelectorAll('.dh-play[data-for]');
    if (!bars.length) return;
    if (!document.getElementById('dh-play-style')) {
      const s = document.createElement('style'); s.id = 'dh-play-style'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    bars.forEach(bar);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
