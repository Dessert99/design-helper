// Reads computed values and layout off the comparison sheet, and screenshots it.
// node check.cjs <url> <shot.png> --section r1-1 --sel '.target' --props borderRadius
// For a value-only check, pass --no-shot in place of <shot.png>.
// --a11y adds, per matched element, its text contrast against the background behind it
// (WCAG ratio), its border and outline contrast against the background around it (for
// non-text 3:1), and its rendered size. It reports; it never fails the run.
// --frames looks for --sel inside the same-origin iframes of the section (a board page).
// The prop name `box` returns the element's box "x y width height" in its own page, so
// gaps between elements can be computed.
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
  console.error('사용법: node check.cjs <url> <shot.png|--no-shot> --section id --sel css --props a,b [--expect-count n] [--expect-distinct n] [--width n] [--height n] [--a11y] [--frames]');
  process.exit(2);
}
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--no-shot' || arg === '--a11y' || arg === '--frames') options[arg] = true;
  else if (allowed.has(arg)) {
    const next = argv[i + 1];
    if (!next || allowed.has(next) || next === '--no-shot' || next === '--a11y' || next === '--frames' ||
        (next.startsWith('--') && arg !== '--props')) usage('옵션 값이 없습니다: ' + arg);
    options[arg] = argv[++i];
  } else if (arg.startsWith('--')) usage('알 수 없는 옵션입니다: ' + arg);
  else positional.push(arg);
}
const section = options['--section'];
const sel = options['--sel'];
const props = (options['--props'] || '').split(',').map(s => s.trim()).filter(Boolean);
const noShot = !!options['--no-shot'];
const a11y = !!options['--a11y'];
const inFrames = !!options['--frames'];
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
if (!!sel !== !!props.length || ((expectedCount || expectedDistinct || a11y) && !sel)) usage('선택자와 CSS 속성을 함께 지정하세요.');

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
    // A motion sheet: wait until its play bars have connected their specimens.
    await p.waitForFunction(() => ![...document.querySelectorAll('.dh-play')].some(b => !b.querySelector('input')),
      null, { timeout: 15000 }).catch(() => failures.push('재생 막대가 준비되지 않았습니다.'));
    if (response && !response.ok()) throw new Error('시트를 불러오지 못했습니다: ' + response.status());
    await p.evaluate(() => document.fonts && document.fonts.ready);

    const report = await p.evaluate(({ sel, props, section, expectedCount, expectedDistinct, a11y, inFrames }) => {
      const gcs = e => ((e.ownerDocument && e.ownerDocument.defaultView) || globalThis).getComputedStyle(e);
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
            // A board page taller or wider than its iframe is cut off without any overflow
            // on the sheet itself. A prototype shown as a window (data-window) scrolls inside
            // on purpose and is left out.
            // Each board's own page size, so its iframe can be given the board's real height.
            boards: [...s.querySelectorAll('iframe')].map(f => {
              try {
                const d = f.contentDocument.documentElement;
                return { src: f.getAttribute('src'), width: d.scrollWidth, height: d.scrollHeight };
              } catch { return { src: f.getAttribute('src'), width: null, height: null }; }
            }),
            clippedBoards: [...s.querySelectorAll('iframe:not([data-window])')].filter(f => {
              try {
                const d = f.contentDocument.documentElement;
                return d.scrollHeight > f.clientHeight + 1 || d.scrollWidth > f.clientWidth + 1;
              } catch { return false; }
            }).length,
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
        if (s.clippedBoards) issues.push('보드가 iframe보다 커서 잘립니다: ' + s.id);
      }
      if (sel && root) {
        const from = [];
        const els = inFrames
          ? [...root.querySelectorAll('iframe')].flatMap(f => {
              try {
                const found = [...f.contentDocument.querySelectorAll(sel)];
                found.forEach(() => from.push(f.getAttribute('src')));
                return found;
              } catch { return []; }
            })
          : [...root.querySelectorAll(sel)];
        r.matched = els.length;
        if (inFrames) r.from = from;   // the iframe each row of values came from
        r.values = els.map(e => {
          const c = gcs(e);
          return props.map(k => {
            if (k === 'box') { const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map(v => Math.round(v * 10) / 10).join(' '); }
            return k.startsWith('--') || k.includes('-') ? c.getPropertyValue(k) : c[k];
          });
        });
        r.distinct = new Set(r.values.map(v => JSON.stringify(v))).size;
        if (!els.length) issues.push('선택자와 일치하는 요소가 없습니다: ' + sel);
        if (r.values.some(row => row.some(v => v === undefined || v === ''))) issues.push('CSS 속성 이름이나 변수 정의를 확인하세요.');
        if (expectedCount !== undefined && r.matched !== expectedCount) issues.push('예상한 요소 수와 다릅니다.');
        if (expectedDistinct !== undefined && r.distinct !== expectedDistinct) issues.push('예상한 적용값 수와 다릅니다.');
        if (a11y) {
          // Let the browser resolve any color syntax (oklch, color-mix, named) to sRGB bytes.
          const cv = document.createElement('canvas'); cv.width = cv.height = 1;
          const cx = cv.getContext('2d', { willReadFrequently: true });
          const rgba = c => {
            const m = /^rgba?\(([^)]+)\)$/.exec(c.trim());
            if (m) { const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; }
            cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1);
            const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
          };
          const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
          const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
          // Composite every background from `node` up to the first opaque one, over white.
          const behind = node => {
            const layers = []; let image = false;
            for (let n = node; n && n.nodeType === 1; n = n.parentElement) {
              const cs = gcs(n);
              if (cs.backgroundImage && cs.backgroundImage !== 'none') image = true;
              const bg = rgba(cs.backgroundColor);
              if (bg[3] > 0) layers.push(bg);
              if (bg[3] >= 1) break;
            }
            let bg = [255, 255, 255, 1];
            for (const layer of layers.reverse()) bg = over(layer, bg);
            return { bg, image };
          };
          const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return Math.round((hi + 0.05) / (lo + 0.05) * 100) / 100; };
          r.a11y = els.map(e => {
            const cs = gcs(e);
            const inside = behind(e), around = behind(e.parentElement);
            const line = (width, style, color) =>
              parseFloat(width) > 0 && style !== 'none' ? ratio(over(rgba(color), around.bg), around.bg) : null;
            const box = e.getBoundingClientRect();
            // An icon is a graphic: its stroke (or fill) against the background, 3:1.
            const svg = e.closest && e.closest('svg');
            const paint = svg && [cs.stroke, cs.fill].find(v => v && v !== 'none' && !/^url/.test(v));
            return { contrast: ratio(over(rgba(cs.color), inside.bg), inside.bg),
              graphic: paint ? ratio(over(rgba(paint), inside.bg), inside.bg) : null,
              border: line(cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor),
              outline: line(cs.outlineWidth, cs.outlineStyle, cs.outlineColor),
              size: [Math.round(box.width), Math.round(box.height)],
              backgroundImage: inside.image || around.image };
          });
        }
      }
      r.issues = issues;
      return r;
    }, { sel, props, section, expectedCount, expectedDistinct, a11y, inFrames });

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
