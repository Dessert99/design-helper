// Renders a logo or icon SVG at the sizes it will really be used, and measures how it holds up.
//
// node pixel.cjs <file.svg> <out dir> [--sizes 16,32,180] [--zoom 8] [--name logo]
//                [--font "Family=path/to/font.woff"]... [--png favicon-32:32,apple-touch-icon:180:#ffffff]
//                [--color #1d4e89] [--lang ko]
// node pixel.cjs outline <in.svg> <font file> <out.svg>
//
// Render: one transparent PNG per size (<name>-<size>.png) and, for sizes up to 48, the same
// pixels enlarged without smoothing (<name>-<size>x<zoom>.png), so a person can see which
// strokes fall between pixels. --font registers a font file for a family the SVG's <text>
// uses; without it, text falls back to an installed font and the report says so.
// --color sets currentColor (default black), so PNGs come out in the brand color. --lang
// (default ko) picks the fallback fonts the way a board page with that lang does.
// Read blur first at 16px: thin is measured once at 256px and scaled, so it can miss
// strokes that merge at 16 when the mark is a shrunk large drawing.
// Per size the report gives:
//   blur       share of drawn pixels that are only partly covered (0 to 1). High at 16px
//              means the mark smears; a crisp mark stays low.
//   thin       how thick the thinnest parts are, in screen pixels at that size: the lower
//              tenth of stroke widths, measured on a 256px render split into dark and light
//              (a white ring inside a dark tile counts as a stroke). Under about 1 means
//              those parts break up or vanish.
//   ink        share of the square that is drawn
// --png writes exports (name:size or name:size:background) for the record's assets.
//
// outline: replaces each <text> (x, y, font-size, text-anchor, letter-spacing, fill; no
// <tspan>) with a <path> drawn from the font file, so the logo no longer needs the font.
// Uses opentype.js from the project, else downloads it once into vendor/ beside this script.
// TTF, OTF and WOFF work; WOFF2 does not.
// Prints a JSON report. Prints NO_PLAYWRIGHT when no browser can be launched: not a pass.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

function usage(msg) {
  if (msg) console.error(msg);
  console.error('사용법: node pixel.cjs <file.svg> <out dir> [--sizes 16,32,180] [--zoom 8] [--name logo] [--font "Family=path"] [--png name:size[:bg],...]');
  console.error('        node pixel.cjs outline <in.svg> <font file> <out.svg>');
  process.exit(2);
}

// ---- outline -------------------------------------------------------------------------
function loadOpentype() {
  try { return require(require.resolve('opentype.js', { paths: [process.cwd()] })); } catch {}
  const vendor = path.join(__dirname, 'vendor', 'opentype');
  const main = path.join(vendor, 'package', 'dist', 'opentype.js');
  if (!fs.existsSync(main)) {
    fs.mkdirSync(vendor, { recursive: true });
    const tgz = execFileSync('npm', ['pack', 'opentype.js@1', '--silent', '--pack-destination', vendor],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 }).trim().split('\n').pop();
    execFileSync('tar', ['xzf', path.join(vendor, tgz), '-C', vendor]);
  }
  return require(main);
}

function outline(input, fontFile, output) {
  if (/\.woff2$/i.test(fontFile)) usage('WOFF2는 윤곽선으로 바꿀 수 없습니다. 같은 서체의 TTF, OTF, WOFF를 쓰세요.');
  const opentype = loadOpentype();
  const buf = fs.readFileSync(fontFile);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  let svg = fs.readFileSync(input, 'utf8');
  const report = { texts: 0, missingGlyphs: [] };
  svg = svg.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/g, (all, attrs, body) => {
    if (/<tspan/.test(body)) throw new Error('<tspan>이 있는 <text>는 바꾸지 않습니다. 줄마다 <text>로 나누세요.');
    const a = (k, d) => { const m = attrs.match(new RegExp(`\\s${k}="([^"]*)"`)); return m ? m[1] : d; };
    const style = a('style', '');
    const css = (k) => { const m = style.match(new RegExp(`${k}\\s*:\\s*([^;]+)`)); return m && m[1].trim(); };
    const text = body.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    const size = parseFloat(a('font-size', css('font-size') || '16'));
    let ls = a('letter-spacing', css('letter-spacing') || '0');
    ls = /em$/.test(ls) ? parseFloat(ls) * size : parseFloat(ls) || 0;
    const glyphs = font.stringToGlyphs(text);
    glyphs.forEach((g, i) => { if (g.index === 0) report.missingGlyphs.push(text[i]); });
    const scale = size / font.unitsPerEm;
    const adv = glyphs.map((g, i) => g.advanceWidth * scale
      + (i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) * scale + ls : 0));
    const width = adv.reduce((s, v) => s + v, 0);
    const anchor = a('text-anchor', css('text-anchor') || 'start');
    let x = parseFloat(a('x', '0')) - (anchor === 'middle' ? width / 2 : anchor === 'end' ? width : 0);
    const y = parseFloat(a('y', '0'));
    const d = [];
    glyphs.forEach((g, i) => { d.push(g.getPath(x, y, size).toPathData(2)); x += adv[i]; });
    report.texts++;
    const keep = ['fill', 'opacity', 'transform', 'class'].map(k => a(k) && `${k}="${a(k)}"`).filter(Boolean).join(' ');
    return `<path ${keep} d="${d.join(' ')}"/>`;
  });
  fs.writeFileSync(output, svg);
  report.out = output;
  report.ok = report.missingGlyphs.length === 0;
  console.log(JSON.stringify(report, null, 1));
  if (!report.ok) process.exitCode = 1;
}

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

// ---- render --------------------------------------------------------------------------
const argv = process.argv.slice(2);
if (argv[0] === 'outline') {
  if (argv.length !== 4) usage();
  try { outline(argv[1], argv[2], argv[3]); } catch (e) { console.error(e.message); process.exit(1); }
} else {
  const opt = { fonts: [] }; const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--font') opt.fonts.push(argv[++i]);
    else if (['--sizes', '--zoom', '--name', '--png', '--color', '--lang'].includes(k)) opt[k] = argv[++i];
    else if (k.startsWith('--')) usage('알 수 없는 옵션입니다: ' + k);
    else positional.push(k);
  }
  const [file, out] = positional;
  if (!file || !out || positional.length > 2) usage();
  const sizes = (opt['--sizes'] || '16,32,180').split(',').map(Number);
  const zoom = Number(opt['--zoom'] || 8);
  if (sizes.some(s => !(s > 0 && s <= 1024)) || !(zoom >= 1 && zoom <= 32)) usage('크기는 1에서 1024, 확대는 1에서 32 사이여야 합니다.');
  const exportsList = (opt['--png'] || '').split(',').filter(Boolean).map(s => {
    const [name, size, bg] = s.split(':');
    if (!name || !(Number(size) > 0)) usage('--png는 이름:크기 또는 이름:크기:배경색입니다: ' + s);
    return { name, size: Number(size), bg: bg || null };
  });
  const fonts = opt.fonts.map(f => {
    const [family, p] = f.split('=');
    if (!family || !p || !fs.existsSync(p)) usage('--font는 "글꼴이름=파일경로"입니다: ' + f);
    const type = { woff2: 'woff2', woff: 'woff', otf: 'opentype', ttf: 'truetype' }[path.extname(p).slice(1).toLowerCase()] || 'truetype';
    return `@font-face{font-family:"${family}";src:url(data:font/${type};base64,${fs.readFileSync(p).toString('base64')}) format("${type}")}`;
  });
  let svg;
  try { svg = fs.readFileSync(file, 'utf8'); } catch { usage('SVG 파일을 읽지 못했습니다: ' + file); }
  if (!/<svg\b/.test(svg)) usage('SVG가 아닙니다: ' + file);
  const name = opt['--name'] || path.basename(file, '.svg');
  fs.mkdirSync(out, { recursive: true });

  (async () => {
    const b = await launch();
    if (!b) { console.log('NO_PLAYWRIGHT'); return; }
    const report = { file, name, sizes: {}, exports: [], issues: [] };
    try {
      const p = await b.newPage({ deviceScaleFactor: 1 });
      p.on('pageerror', e => report.issues.push('스크립트 오류: ' + e.message));
      const fit = svg.replace(/<svg\b([^>]*)>/, (m, attrs) =>
        '<svg' + attrs.replace(/\s(width|height)="[^"]*"/g, '') + ' width="100%" height="100%">');
      const lang = (opt['--lang'] || 'ko').replace(/[^\w-]/g, '');
      const color = (opt['--color'] || '#000').replace(/[^#\w(),.%\s-]/g, '');
      await p.setContent(`<!doctype html><html lang="${lang}"><style>${fonts.join('')} html,body{margin:0;background:transparent}
        #s{display:block;color:${color}}</style><div id="s">${fit}</div></html>`);
      const families = await p.evaluate(async () => {
        await document.fonts.ready;
        return [...document.querySelectorAll('text')].map(t => getComputedStyle(t).fontFamily);
      });
      if (families.length && !fonts.length) report.issues.push('글자가 있지만 --font가 없어 설치된 글꼴로 그렸습니다: ' + [...new Set(families)].join(', '));
      const shoot = async (size, bg) => {
        await p.evaluate(([s, c]) => {
          const el = document.getElementById('s');
          el.style.width = el.style.height = s + 'px';
          el.style.background = c || 'transparent';
        }, [size, bg]);
        return p.locator('#s').screenshot({ omitBackground: !bg });
      };
      const measure = (png, s, z) => p.evaluate(async ([b64, size, zoomBy]) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas'); c.width = c.height = size;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, size, size).data;
        let ink = 0, part = 0;
        for (let i = 3; i < d.length; i += 4) { if (d[i] > 8) { ink++; if (d[i] < 235) part++; } }
        let zoomed = null;
        if (zoomBy > 1) {
          const zc = document.createElement('canvas'); zc.width = zc.height = size * zoomBy;
          const zx = zc.getContext('2d'); zx.imageSmoothingEnabled = false; zx.drawImage(c, 0, 0, size * zoomBy, size * zoomBy);
          zoomed = zc.toDataURL('image/png').split(',')[1];
        }
        return { ink: ink / (size * size), blur: ink ? part / ink : 0, zoomed };
      }, [png.toString('base64'), s, z]);
      // Thinnest parts: split a render on white into dark and light by luminance. The light
      // area joined to the edge is the background; the rest (holes, rings) is a shape too.
      // A chamfer distance transform gives each pixel its distance to the other tone; each
      // pixel's local width is the widest inscribed disk covering it. The lower tenth of those
      // widths, by area, is the thinnest part; sharp corners are too small to move it.
      const thinnest = (png) => p.evaluate(async (b64) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const n = img.width, c = document.createElement('canvas'); c.width = c.height = n;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, n, n).data;
        const dark = new Uint8Array(n * n);
        for (let k = 0; k < n * n; k++) dark[k] = (0.2126 * d[k * 4] + 0.7152 * d[k * 4 + 1] + 0.0722 * d[k * 4 + 2]) < 128 ? 1 : 0;
        const bg = new Uint8Array(n * n), stack = [];
        for (let k = 0; k < n; k++) for (const q of [k, (n - 1) * n + k, k * n, k * n + n - 1]) if (!dark[q] && !bg[q]) { bg[q] = 1; stack.push(q); }
        while (stack.length) {
          const q = stack.pop(), i = q % n, j = (q - i) / n;
          for (const [a, b2] of [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]]) {
            if (a < 0 || b2 < 0 || a >= n || b2 >= n) continue;
            const r = b2 * n + a; if (!dark[r] && !bg[r]) { bg[r] = 1; stack.push(r); }
          }
        }
        const widths = [];
        for (const inside of [k => dark[k] === 1, k => !dark[k] && !bg[k]]) {
          const t = new Float32Array(n * n);
          for (let k = 0; k < n * n; k++) t[k] = inside(k) ? 1e9 : 0;
          const at = (i, j) => (i < 0 || j < 0 || i >= n || j >= n ? 0 : t[j * n + i]);
          for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * n + i; if (t[k])
            t[k] = Math.min(t[k], at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + 1.414, at(i + 1, j - 1) + 1.414); }
          for (let j = n - 1; j >= 0; j--) for (let i = n - 1; i >= 0; i--) { const k = j * n + i; if (t[k])
            t[k] = Math.min(t[k], at(i + 1, j) + 1, at(i, j + 1) + 1, at(i + 1, j + 1) + 1.414, at(i - 1, j + 1) + 1.414); }
          // Local thickness: every pixel takes the widest inscribed disk that covers it.
          const local = new Float32Array(n * n);
          for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
            const v = t[j * n + i]; if (v < 1) continue;
            if (!(v >= at(i - 1, j) && v >= at(i + 1, j) && v >= at(i, j - 1) && v >= at(i, j + 1))) continue;
            const r = Math.ceil(v), w = 2 * v - 1;
            for (let b2 = -r; b2 <= r; b2++) for (let a = -r; a <= r; a++) {
              if (a * a + b2 * b2 > v * v) continue;
              const q = (j + b2) * n + (i + a);
              if (q >= 0 && q < n * n && inside(q) && local[q] < w) local[q] = w;
            }
          }
          for (let k = 0; k < n * n; k++) if (inside(k) && local[k] > 0) widths.push(local[k]);
        }
        if (!widths.length) return 0;
        widths.sort((a, b) => a - b);
        return widths[Math.floor(widths.length * 0.1)];
      }, png.toString('base64'));

      const thin256 = await thinnest(await shoot(256, '#ffffff'));
      for (const s of sizes) {
        const png = await shoot(s);
        const f = path.join(out, `${name}-${s}.png`);
        fs.writeFileSync(f, png);
        const m = await measure(png, s, s <= 48 ? zoom : 1);
        const entry = { png: f, blur: +m.blur.toFixed(2), thin: +(thin256 * s / 256).toFixed(2), ink: +m.ink.toFixed(2) };
        if (m.zoomed) { entry.zoomed = path.join(out, `${name}-${s}x${zoom}.png`); fs.writeFileSync(entry.zoomed, Buffer.from(m.zoomed, 'base64')); }
        report.sizes[s] = entry;
      }
      for (const e of exportsList) {
        const f = path.join(out, `${e.name}.png`);
        fs.writeFileSync(f, await shoot(e.size, e.bg));
        report.exports.push({ png: f, size: e.size, background: e.bg });
      }
    } finally { await b.close(); }
    report.ok = !report.issues.some(i => i.startsWith('스크립트 오류'));
    console.log(JSON.stringify(report, null, 1));
    if (!report.ok) process.exitCode = 1;
  })().catch(e => { console.error(String(e && e.message || e)); process.exit(1); });
}
