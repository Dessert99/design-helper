// Walks one task through a prototype page and records the step strip.
// node walk.cjs <prototype url> <out dir> --scenario <scenario.json> [--width n] [--height n]
//
// scenario.json:
// { "name": "B",
//   "list": ".orders",                        // optional: element whose scroll position must survive,
//                                             // or "page" for the window's own scroll
//   "clip": ".workspace",                     // optional: screenshot only this region, so the
//                                             // strip shows what changes at a readable size
//   "setup": [{ "scroll": [".orders", 600] }],  // optional, not counted, before step 1
//   "steps": [
//     { "label": "목록" },
//     { "label": "패널 열기", "click": "text=20261125-0010", "expect": ".panel" },
//     { "label": "취소", "click": "#cancel", "expect": ".toast" } ],
//   "keyboard": [{ "press": "Tab", "times": 5 }, { "press": "Enter" }, { "wait": 200 }],  // optional
//   "keyboardExpect": ".toast" }
// Actions: click (selector), fill ([selector, text]), press (key, with "times"), scroll
// ([selector, y]), wait (ms). "expect" is a selector that must be visible after the step.
// Prints a JSON report; exits 1 when a step's expectation fails. Prints NO_PLAYWRIGHT when
// no browser can be launched: that is not a pass.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const argv = process.argv.slice(2);
const opt = {}; const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (['--scenario', '--width', '--height'].includes(argv[i])) opt[argv[i]] = argv[++i];
  else if (argv[i].startsWith('--')) { console.error('알 수 없는 옵션입니다: ' + argv[i]); process.exit(2); }
  else positional.push(argv[i]);
}
const [url, out] = positional;
if (!url || !out || !opt['--scenario']) {
  console.error('사용법: node walk.cjs <url> <out dir> --scenario <scenario.json> [--width n] [--height n]');
  process.exit(2);
}
const scenario = JSON.parse(fs.readFileSync(opt['--scenario'], 'utf8'));
const width = Number(opt['--width'] || 1440), height = Number(opt['--height'] || 900);
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

const where = (p, list) => p.evaluate(sel => {
  const el = sel && sel !== 'page' && document.querySelector(sel);
  return { url: location.pathname + location.search + location.hash,
    scroll: el ? Math.round(el.scrollTop) : Math.round(scrollY) };
}, list || null);

async function act(p, s, count) {
  const times = s.times || 1;
  if (s.click) { await p.locator(s.click).first().click({ timeout: 3000 }); count.clicks++; }
  if (s.fill) { await p.locator(s.fill[0]).first().fill(s.fill[1], { timeout: 3000 }); count.inputs++; }
  if (s.press) for (let i = 0; i < times; i++) { await p.keyboard.press(s.press); count.presses++; }
  if (s.scroll) await p.evaluate(([sel, y]) => { const el = document.querySelector(sel); if (el) el.scrollTop = y; else scrollTo(0, y); }, s.scroll);
  if (s.wait) await p.waitForTimeout(s.wait);
  await p.waitForTimeout(150);
}

(async () => {
  const b = await launch();
  if (!b) { console.log('NO_PLAYWRIGHT'); return; }
  const report = { name: scenario.name || '', steps: [], clicks: 0, inputs: 0, presses: 0,
    transitions: 0, issues: [] };
  try {
    const p = await b.newPage({ viewport: { width, height } });
    p.on('pageerror', e => report.issues.push('스크립트 오류: ' + e.message));
    await p.goto(url, { waitUntil: 'load', timeout: 15000 });
    for (const s of scenario.setup || []) await act(p, s, { clicks: 0, inputs: 0, presses: 0 });
    let last = null;
    for (const [i, s] of (scenario.steps || []).entries()) {
      try { await act(p, s, report); } catch (e) {
        report.issues.push(`${i + 1}단계 "${s.label}" 동작 실패: ${String(e.message).split('\n')[0]}`); break;
      }
      if (s.expect && !(await p.locator(s.expect).first().isVisible().catch(() => false))) {
        report.issues.push(`${i + 1}단계 "${s.label}" 뒤에 ${s.expect}가 보이지 않습니다.`);
      }
      const now = await where(p, scenario.list);
      if (last && now.url !== last.url) report.transitions++;
      const shot = path.join(out, `${report.name || 'walk'}-${i + 1}.png`);
      // Clip to the part of the region inside the window: what the person sees at this step.
      const box = scenario.clip && await p.locator(scenario.clip).first().boundingBox().catch(() => null);
      const x = box ? Math.max(0, box.x) : 0, y = box ? Math.max(0, box.y) : 0;
      const w = box ? Math.min(width, box.x + box.width) - x : 0, h = box ? Math.min(height, box.y + box.height) - y : 0;
      if (w > 0 && h > 0) await p.screenshot({ path: shot, clip: { x, y, width: w, height: h } });
      else await p.screenshot({ path: shot });
      report.steps.push({ label: s.label || '', shot, ...now });
      last = now;
    }
    const first = report.steps[0], end = report.steps[report.steps.length - 1];
    if (scenario.list && first && end) report.listKept = first.scroll === end.scroll;

    if (scenario.keyboard) {
      const k = await b.newPage({ viewport: { width, height } });
      await k.goto(url, { waitUntil: 'load', timeout: 15000 });
      for (const s of scenario.setup || []) await act(k, s, { clicks: 0, inputs: 0, presses: 0 });
      const trail = []; let presses = 0;
      for (const s of scenario.keyboard) {
        if (s.wait) { await k.waitForTimeout(s.wait); continue; }
        for (let i = 0; i < (s.times || 1); i++) {
          if (s.press) { await k.keyboard.press(s.press); presses++; }
          if (s.type) await k.keyboard.type(s.type);
          // Let a page that re-renders after the key (hash change, async update) settle, so a
          // timing artifact isn't reported as a keyboard problem.
          await k.waitForTimeout(scenario.keyDelay || 120);
          trail.push(await k.evaluate(() => {
            const a = document.activeElement;
            if (!a || a === document.body) return '(없음)';
            const name = (a.getAttribute('aria-label') || a.textContent || a.value || '').trim().slice(0, 24);
            return a.tagName.toLowerCase() + (name ? ' "' + name + '"' : '');
          }));
        }
      }
      await k.waitForTimeout(150);
      const done = scenario.keyboardExpect
        ? await k.locator(scenario.keyboardExpect).first().isVisible().catch(() => false) : null;
      report.keyboard = { done, presses, trail };
      await k.close();
    }
    report.ok = report.issues.length === 0;
    console.log(JSON.stringify(report, null, 1));
    if (!report.ok) process.exitCode = 1;
  } finally { await b.close(); }
})().catch(e => { console.error(String(e && e.message || e)); process.exit(1); });
