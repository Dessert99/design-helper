// Measures one motion specimen by moving its own animation to fixed times (design-motion).
// node motion.cjs <specimen url> <out dir> [--name B] [--frames 0,100,200,300,500,end]
//                 [--step 10] [--clip <selector>] [--track <sel,sel>] [--span ms] [--width n] [--height n]
//
// The page must have connected its animation with motion.js (window.dhMotion.ready). Since
// the animation is the real library seeked to each time, a frame here is what the library
// draws at that moment, not a redraw.
//   frames     one screenshot per time (<name>-<ms>.png), clipped to --clip: the frame strip
//   graph      <name>-graph.svg: each tracked element's progress from start to end over time.
//              Give every specimen of a section the same --span (the longest duration), so
//              their graphs share one time axis
//   duration   the animation's own length, ms
//   settle     when every tracked element is within 0.5px and 0.01 opacity of its end, ms
//   p90        when every tracked element has covered 90% of its travel, ms
//   overshoot  furthest any element goes past its end along its path, px
//   starts     when each tracked element first moves, ms; spread is first to last start.
//              Tells choreographies apart (together: spread 0; one after another: wide)
//   concurrent most elements moving within one 10ms step
//   layout     tracked elements whose layout box (not transform) changes: the animation
//              moves width, top, margin or the like, which makes the page reflow
//   reduced    the same page with prefers-reduced-motion: its length and the furthest any
//              element travels (0 means nothing moves)
// --track defaults to the page's dhMotion.track. Prints a JSON report; exits 1 when the page
// never becomes ready or a script fails. Prints NO_PLAYWRIGHT when no browser can be
// launched: that is not a pass.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

function usage(msg) {
  if (msg) console.error(msg);
  console.error('사용법: node motion.cjs <url> <out dir> [--name B] [--frames 0,100,200,end] [--step 10] [--clip sel] [--track sel,sel] [--span ms] [--width n] [--height n]');
  process.exit(2);
}
const argv = process.argv.slice(2);
const opt = {}; const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (['--name', '--frames', '--step', '--clip', '--track', '--span', '--width', '--height'].includes(argv[i])) {
    if (argv[i + 1] === undefined) usage(argv[i] + ' 뒤에 값이 없습니다.');
    opt[argv[i]] = argv[++i];
  } else if (argv[i].startsWith('--')) usage('알 수 없는 옵션입니다: ' + argv[i]);
  else positional.push(argv[i]);
}
const [url, out] = positional;
if (!url || !out || positional.length > 2) usage();
const name = opt['--name'] || 'motion';
const step = Number(opt['--step'] || 10);
const width = Number(opt['--width'] || 1080), height = Number(opt['--height'] || 700);
const frameList = (opt['--frames'] || '0,100,200,300,500,end').split(',');
const span = opt['--span'] ? Number(opt['--span']) : null;
if (!(step >= 1 && step <= 100) || !(width > 0) || !(height > 0) || (span !== null && !(span > 0))
  || frameList.some(f => f !== 'end' && !(Number(f) >= 0))) usage('숫자 옵션을 확인하세요.');
fs.mkdirSync(out, { recursive: true });

// >>> launch: kept identical in every kit script that opens a browser (scripts/test-kit.py checks it)
const ver = d => { try { return require(path.join(d, 'package.json')).version.split('.').map(Number); } catch { return [0]; } };
const newer = (a, b) => { for (let i = 0; i < 3; i++) if ((b[i] || 0) !== (a[i] || 0)) return (b[i] || 0) - (a[i] || 0); return 0; };
const dirs = p => { try { return fs.readdirSync(p).map(f => path.join(p, f)); } catch { return []; } };

// Look in the project, the Codex runtime, the global install, then the npx cache.
// The first module that launches ends the search.
function* modules() {
  for (const name of ['playwright', 'playwright-core', '@playwright/test']) {
    try { yield path.dirname(require.resolve(name + '/package.json', { paths: [process.cwd()] })); } catch {}
  }
  for (const rt of dirs(path.join(os.homedir(), '.cache', 'codex-runtimes'))) {
    for (const name of ['playwright', 'playwright-core']) {
      const d = path.join(rt, 'dependencies', 'node', 'node_modules', name);
      if (fs.existsSync(d)) yield d;
    }
  }
  try {
    const g = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }).trim();
    for (const name of ['playwright', 'playwright-core']) if (fs.existsSync(path.join(g, name))) yield path.join(g, name);
  } catch {}
  const npx = dirs(path.join(os.homedir(), '.npm', '_npx'))
    .flatMap(d => ['playwright', 'playwright-core'].map(n => path.join(d, 'node_modules', n)))
    .filter(d => fs.existsSync(d))
    .sort((a, b) => newer(ver(a), ver(b)));
  yield* npx;
}

// When the module's own browser is missing, look for one already downloaded.
function browsers() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
    path.join(os.homedir(), '.cache', 'ms-playwright'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright')].filter(Boolean);
  const names = new Set(['Chromium', 'Google Chrome for Testing', 'chrome', 'chrome.exe',
    'chrome-headless-shell', 'chrome-headless-shell.exe']);
  const found = [];
  const walk = (d, depth) => {
    for (const p of dirs(d)) {
      let st; try { st = fs.statSync(p); } catch { continue; }
      if (st.isDirectory() && depth > 0) walk(p, depth - 1);
      else if (st.isFile() && names.has(path.basename(p))) found.push(p);
    }
  };
  for (const r of roots) for (const d of dirs(r)) if (/chromium/.test(path.basename(d))) walk(d, 5);
  const rev = p => +(p.match(/chromium[^/\\]*-(\d+)/) || [0, 0])[1];
  return found.sort((a, b) => rev(b) - rev(a));
}

async function launch() {
  let exes;
  const tried = new Set();
  for (const m of modules()) {
    if (tried.has(m)) continue;
    tried.add(m);
    let chromium;
    try { ({ chromium } = require(m)); } catch { continue; }
    if (!chromium) continue;
    try { return await chromium.launch({ timeout: 5000 }); } catch {}
    exes ??= browsers();
    for (const o of [...exes.map(e => ({ executablePath: e })), { channel: 'chrome' }]) {
      try { return await chromium.launch({ ...o, timeout: 5000 }); } catch {}
    }
  }
  return null;
}
// <<< launch

const settle = (p) => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

async function open(b, reduced) {
  const ctx = await b.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push('스크립트 오류: ' + e.message));
  await p.goto(url, { waitUntil: 'load', timeout: 15000 });
  const ok = await p.waitForFunction(() => window.dhMotion && window.dhMotion.ready, null, { timeout: 10000 })
    .then(() => true, () => false);
  if (!ok) errors.push('dhMotion이 준비되지 않았습니다. 시안 페이지에서 motion.js로 애니메이션을 연결하세요.');
  return { p, ctx, errors, ok };
}

// Samples every tracked element at every step, inside the page. Each seek waits two frames:
// some libraries (Motion's transforms) draw a seek on a later frame, not at once.
const sample = (p, track, stepMs) => p.evaluate(async ([sels, s]) => {
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  const els = sels.flatMap(sel => [...document.querySelectorAll(sel)].map((el, i) => ({ el, label: sel + (i ? `:${i + 1}` : '') })));
  const dur = window.dhMotion.duration();
  const rows = [];
  for (let ms = 0; ms <= dur * 1000 + s; ms += s) {
    window.dhMotion.seek(Math.min(ms, dur * 1000) / 1000);
    await frame();
    rows.push(els.map(({ el }) => {
      const r = el.getBoundingClientRect();
      return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height, Number(getComputedStyle(el).opacity),
        el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight];
    }));
  }
  return { labels: els.map(e => e.label), dur, rows };
}, [track, stepMs]);

function analyse({ labels, dur, rows }, s) {
  const n = labels.length, end = rows[rows.length - 1];
  const res = { duration: Math.round(dur * 1000), settle: 0, p90: 0, overshoot: 0, concurrent: 0, layout: [], travel: 0, series: [], starts: {} };
  for (let k = 0; k < n; k++) {
    const e = end[k], start = rows[0][k];
    const dist = (r) => Math.hypot(r[0] - e[0], r[1] - e[1], r[2] - e[2], r[3] - e[3]);
    const d0 = Math.max(...rows.map(r => dist(r[k])));
    const o0 = Math.max(...rows.map(r => Math.abs(r[k][4] - e[4])));
    res.travel = Math.max(res.travel, d0);
    const dir = [e[0] - start[0], e[1] - start[1]], len = Math.hypot(...dir) || 1;
    const series = rows.map((r, i) => {
      const v = r[k];
      const moved = dist(v) > 0.5 || Math.abs(v[4] - e[4]) > 0.01;
      if (moved) res.settle = Math.max(res.settle, (i + 1) * s);
      const pd = d0 > 0.5 ? 1 - dist(v) / d0 : 1, po = o0 > 0.01 ? 1 - Math.abs(v[4] - e[4]) / o0 : 1;
      if (Math.min(pd, po) < 0.9) res.p90 = Math.max(res.p90, (i + 1) * s);
      const past = ((v[0] - e[0]) * dir[0] + (v[1] - e[1]) * dir[1]) / len;
      if (Math.hypot(...dir) > 0.5) res.overshoot = Math.max(res.overshoot, past);
      return d0 > 0.5 ? pd : po;
    });
    res.series.push({ label: labels[k], progress: series });
    const first = rows.findIndex(r => Math.hypot(r[k][0] - start[0], r[k][1] - start[1], r[k][2] - start[2], r[k][3] - start[3]) > 0.1
      || Math.abs(r[k][4] - start[4]) > 0.005);
    if (first > 0) res.starts[labels[k]] = (first - 1) * s;
    if (rows.some(r => r[k].slice(5).some((v, j) => v !== start[5 + j]))) res.layout.push(labels[k]);
  }
  for (let i = 1; i < rows.length; i++) {
    let moving = 0;
    for (let k = 0; k < n; k++) {
      const a = rows[i - 1][k], b = rows[i][k];
      if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]) > 0.1 || Math.abs(a[4] - b[4]) > 0.005) moving++;
    }
    res.concurrent = Math.max(res.concurrent, moving);
  }
  res.settle = Math.min(res.settle, res.duration + s);
  res.overshoot = Math.round(res.overshoot * 10) / 10;
  res.travel = Math.round(res.travel * 10) / 10;
  const t = Object.values(res.starts);
  res.spread = t.length ? Math.max(...t) - Math.min(...t) : 0;
  return res;
}

// One color per selector (all cards share one), with a legend along the bottom.
function graph(series, s, totalMs) {
  const W = 480, H = 136, pad = 8, plot = H - 2 * pad - 30;
  const span = Math.max(totalMs, s);
  const shades = ['#1f1f23', '#3b5bdb', '#2f9e8f', '#c2410c', '#8b5cf6', '#a1a1aa'];
  const groups = [...new Set(series.map(x => x.label.replace(/:\d+$/, '')))];
  const color = (label) => shades[Math.min(groups.indexOf(label.replace(/:\d+$/, '')), shades.length - 1)];
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const lines = series.map((ser) => {
    const pts = ser.progress.map((v, i) => `${(pad + (i * s / span) * (W - 2 * pad)).toFixed(1)},${(pad + 14 + plot - Math.max(-0.2, Math.min(1.2, v)) * plot).toFixed(1)}`);
    return `<polyline fill="none" stroke="${color(ser.label)}" stroke-width="1.5" points="${pts.join(' ')}"/>`;
  });
  let x = pad;
  const legend = groups.map((g) => {
    const item = `<rect x="${x}" y="${H - 14}" width="10" height="3" fill="${color(g)}"/>` +
      `<text x="${x + 14}" y="${H - 10}" font-size="10" font-family="sans-serif" fill="#52525b">${esc(g)}</text>`;
    x += 24 + g.length * 6;
    return item;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" rx="6" fill="#fafafa" stroke="#ececef"/>` +
    `<line x1="${pad}" x2="${W - pad}" y1="${pad + 14}" y2="${pad + 14}" stroke="#e4e4e7" stroke-dasharray="3 3"/>` +
    `<text x="${pad}" y="${pad + 8}" font-size="10" font-family="sans-serif" fill="#8b8b93">진행 (위가 끝), 0부터 ${span}ms</text>` +
    lines.join('') + legend.join('') + '</svg>';
}

(async () => {
  const b = await launch();
  if (!b) { console.log('NO_PLAYWRIGHT'); return; }
  const report = { url, name, frames: [], issues: [] };
  try {
    const full = await open(b, false);
    report.issues.push(...full.errors);
    if (full.ok) {
      const track = opt['--track'] ? opt['--track'].split(',') : await full.p.evaluate(() => window.dhMotion.track || []);
      if (!track.length) report.issues.push('잴 요소가 없습니다. --track이나 dhMotion의 track을 주세요.');
      const data = await sample(full.p, track, step);
      if (track.length && !data.labels.length) report.issues.push('track 선택자에 맞는 요소가 없습니다: ' + track.join(', '));
      const m = analyse(data, step);
      Object.assign(report, { duration: m.duration, settle: m.settle, p90: m.p90, overshoot: m.overshoot,
        starts: m.starts, spread: m.spread, concurrent: m.concurrent, layout: m.layout, tracked: data.labels });
      const g = path.join(out, `${name}-graph.svg`);
      fs.writeFileSync(g, graph(m.series, step, span || m.duration));
      report.graph = g;
      for (const f of frameList) {
        const ms = f === 'end' ? m.duration : Number(f);
        await full.p.evaluate((t) => window.dhMotion.seek(t), Math.min(ms, m.duration) / 1000);
        await settle(full.p);
        const shot = path.join(out, `${name}-${f === 'end' ? 'end' : ms}.png`);
        const box = opt['--clip'] && await full.p.locator(opt['--clip']).first().boundingBox().catch(() => null);
        if (opt['--clip'] && !box) { report.issues.push('--clip 선택자를 찾지 못했습니다: ' + opt['--clip']); break; }
        await full.p.screenshot(box ? { path: shot, clip: box } : { path: shot });
        // A time past this specimen's end shows its end state; say so on the strip.
        report.frames.push(ms > m.duration ? { ms, shot, pastEnd: true } : { ms, shot });
      }
    }
    await full.ctx.close();

    const red = await open(b, true);
    if (red.ok) {
      const track = opt['--track'] ? opt['--track'].split(',') : await red.p.evaluate(() => window.dhMotion.track || []);
      const m = analyse(await sample(red.p, track, step), step);
      report.reduced = { duration: m.duration, travel: m.travel };
    } else report.issues.push('움직임 줄이기 판에서 ' + red.errors.join(' '));
    await red.ctx.close();
  } finally { await b.close(); }
  report.ok = report.issues.length === 0;
  console.log(JSON.stringify(report, null, 1));
  if (!report.ok) process.exitCode = 1;
})().catch(e => { console.error(String(e && e.message || e)); process.exit(1); });
