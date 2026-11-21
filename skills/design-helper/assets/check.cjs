// Reads computed values and layout off the comparison sheet, and screenshots it.
// node check.cjs <url> <shot.png> --section r1-1 --sel '.target' --props borderRadius
// For a value-only check, pass --no-shot in place of <shot.png>.
// Prints NO_PLAYWRIGHT when no browser can be launched. That is not a pass.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const argv = process.argv.slice(2);
const options = {};
const positional = [];
const allowed = new Set(['--section', '--sel', '--props', '--width', '--height', '--expect-count', '--expect-distinct']);
function usage(message) {
  console.error(message);
  console.error('사용법: node check.cjs <url> <shot.png|--no-shot> --section id --sel css --props a,b [--expect-count n] [--expect-distinct n] [--width n] [--height n]');
  process.exit(2);
}
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--no-shot') options[arg] = true;
  else if (allowed.has(arg)) {
    const next = argv[i + 1];
    if (!next || allowed.has(next) || next === '--no-shot' ||
        (next.startsWith('--') && arg !== '--props')) usage('옵션 값이 없습니다: ' + arg);
    options[arg] = argv[++i];
  } else if (arg.startsWith('--')) usage('알 수 없는 옵션입니다: ' + arg);
  else positional.push(arg);
}
const section = options['--section'];
const sel = options['--sel'];
const props = (options['--props'] || '').split(',').map(s => s.trim()).filter(Boolean);
const noShot = !!options['--no-shot'];
const [url, shot] = positional;
const number = (key, fallback) => {
  const n = options[key] === undefined ? fallback : Number(options[key]);
  if (n !== undefined && (!Number.isInteger(n) || n <= 0)) usage('양의 정수가 필요합니다: ' + key);
  return n;
};
const width = number('--width', 1600), height = number('--height', 1000);
const expectedCount = number('--expect-count');
const expectedDistinct = number('--expect-distinct');
if (!url || (!noShot && !shot) || (noShot && shot) || positional.length > 2) usage('URL과 출력 방식을 확인하세요.');
if (!!sel !== !!props.length || ((expectedCount || expectedDistinct) && !sel)) usage('선택자와 CSS 속성을 함께 지정하세요.');

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

(async () => {
  const b = await launch();
  if (!b) { console.log('NO_PLAYWRIGHT'); return; }
  try {
    const p = await b.newPage({ viewport: { width, height } });
    const failures = [];
    p.on('pageerror', e => failures.push('스크립트 오류: ' + e.message));
    p.on('requestfailed', r => failures.push('리소스 요청 실패: ' + r.url()));
    p.on('response', r => { if (r.status() >= 400) failures.push('리소스 응답 오류: ' + r.status() + ' ' + r.url()); });
    const response = await p.goto(url, { waitUntil: 'load', timeout: 15000 });
    if (response && !response.ok()) throw new Error('시트를 불러오지 못했습니다: ' + response.status());
    await p.evaluate(() => document.fonts && document.fonts.ready);

    const report = await p.evaluate(({ sel, props, section, expectedCount, expectedDistinct }) => {
      const sections = [...document.querySelectorAll('.dh-main > section')];
      const root = section ? sections.find(s => s.id === section) : document;
      const issues = [];
      const clipped = frame => {
        if (frame.scrollWidth > frame.clientWidth + 1 || frame.scrollHeight > frame.clientHeight + 1) return true;
        const box = frame.getBoundingClientRect();
        return [...frame.querySelectorAll('.target')].some(e => {
          const r = e.getBoundingClientRect();
          return r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1;
        });
      };
      const r = {
        sections: (section && root ? [root] : sections).map(s => {
          const primary = s.querySelector('.dh-grid');
          const frames = [...(primary?.querySelectorAll('.spec .dh-frame') || [])];
          const top = s.getBoundingClientRect().top;
          return {
            id: s.id, specs: s.querySelectorAll('.spec').length,
            primarySpecs: primary?.querySelectorAll('.spec').length || 0,
            overflowX: [...s.querySelectorAll('.dh-grid')].some(g => g.scrollWidth > g.clientWidth + 1),
            clippedFrames: [...s.querySelectorAll('.dh-frame')].filter(clipped).length,
            firstScreen: frames.filter(f => {
              const box = f.getBoundingClientRect();
              return box.width > 0 && box.height > 0 && box.top >= top && box.bottom - top <= innerHeight;
            }).length,
          };
        }),
        viewport: { width: innerWidth, height: innerHeight },
        pageOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
      if (section && !root) issues.push('비교 구역이 없습니다: ' + section);
      if (!sections.length) issues.push('비교 구역이 없습니다.');
      if (r.pageOverflowX) issues.push('페이지에 가로 넘침이 있습니다.');
      for (const s of r.sections) {
        if (!s.specs) issues.push('표본이 없습니다: ' + s.id);
        if (s.overflowX || s.clippedFrames) issues.push('표본이 넘치거나 잘립니다: ' + s.id);
      }
      if (sel && root) {
        const els = [...root.querySelectorAll(sel)];
        r.matched = els.length;
        r.values = els.map(e => {
          const c = getComputedStyle(e);
          return props.map(k => k.startsWith('--') || k.includes('-') ? c.getPropertyValue(k) : c[k]);
        });
        r.distinct = new Set(r.values.map(v => JSON.stringify(v))).size;
        if (!els.length) issues.push('선택자와 일치하는 요소가 없습니다: ' + sel);
        if (r.values.some(row => row.some(v => v === undefined || v === ''))) issues.push('CSS 속성 이름이나 변수 정의를 확인하세요.');
        if (expectedCount !== undefined && r.matched !== expectedCount) issues.push('예상한 요소 수와 다릅니다.');
        if (expectedDistinct !== undefined && r.distinct !== expectedDistinct) issues.push('예상한 적용값 수와 다릅니다.');
      }
      r.issues = issues;
      return r;
    }, { sel, props, section, expectedCount, expectedDistinct });

    if (!noShot) {
      const el = section && await p.evaluateHandle(id => document.getElementById(id), section);
      if (el && el.asElement()) await el.asElement().screenshot({ path: shot });
      else await p.screenshot({ path: shot, fullPage: true });
      report.shot = shot;
    }
    report.issues.push(...failures);
    report.ok = report.issues.length === 0;
    console.log(JSON.stringify(report, null, 1));
    if (!report.ok) process.exitCode = 1;
  } finally {
    await b.close();
  }
})().catch(e => { console.error(String(e && e.message || e)); process.exit(1); });
