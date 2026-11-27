// Gathers icons from public icon sets so boards can draw the same concepts in each set.
//
// node icons.cjs find <set> <word> [word...]   names in the set containing any word
// node icons.cjs collect <map.json> <out dir>  one icons/<set>.js per set, plus a report
//
// Sets: lucide, phosphor, tabler, heroicons, material. A set is read from the project's
// node_modules when its SVG package is installed there (run from the project root), else
// downloaded once with `npm pack` into icons/vendor beside this script (the workspace), so
// find and collect share one download and teardown removes it. The project's React package
// (lucide-react, @tabler/icons-react, @heroicons/react) only picks the version to download:
// the installed one, else the range in package.json.
// find lists exact matches first, then names starting with the word, then the rest.
//
// map.json:
// A set's "version" pins the download (the version the record settled), ahead of the project's.
// { "sets": { "lucide": { "version": "1.81.0" }, "phosphor": { "weight": "regular" }, "tabler": { "style": "outline" },
//             "heroicons": { "style": "24/outline" }, "material": { "style": "rounded" } },
//   "concepts": [ { "id": "settings", "label": "설정",
//                   "names": { "lucide": "settings", "phosphor": "gear", "tabler": "settings" } } ] }
//
// <out dir>/<set>.js defines window.dhIcons[set] = { id: '<svg ...>' } and, on load,
// replaces every <i data-ic="id" data-size="16"></i> with the inline SVG (class "ic").
// Inline, so the board's CSS can set color and stroke-width. A concept missing from a set
// becomes <span class="ic-miss">없음</span>; nothing is drawn in its place.
// Prints a JSON report: per set the version, license, source, how it draws (stroke or
// fill), the nominal stroke at 16/20/24px, missing concepts with near names. Exits 1 when a
// set can't be read.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SETS = {
  lucide: { pkg: 'lucide-static', react: 'lucide-react', file: (n) => `icons/${n}.svg` },
  phosphor: { pkg: '@phosphor-icons/core', react: null,
    file: (n, o) => { const w = o.weight || 'regular'; return `assets/${w}/${n}${w === 'regular' ? '' : '-' + w}.svg`; },
    // Phosphor draws with fills on a 256 grid; its weights correspond to these strokes.
    nominal: (o) => ({ thin: 8, light: 12, regular: 16, bold: 24, fill: null, duotone: 16 }[o.weight || 'regular']) / 256 },
  tabler: { pkg: '@tabler/icons', react: '@tabler/icons-react', file: (n, o) => `icons/${o.style || 'outline'}/${n}.svg` },
  heroicons: { pkg: 'heroicons', react: '@heroicons/react', file: (n, o) => `${o.style || '24/outline'}/${n}.svg` },
  material: { pkg: '@material-symbols/svg-400', react: null,
    file: (n, o) => `${o.style || 'outlined'}/${n}${o.fill ? '-fill' : ''}.svg`,
    // Weight 400 outlines are 60 units thick on the 960 grid.
    nominal: (o) => (o.fill ? null : 60 / 960) },
};
const dirOf = (set, o) => path.dirname(SETS[set].file('x', o || {}));

function usage(msg) {
  if (msg) console.error(msg);
  console.error('사용법: node icons.cjs find <set> <word...> | node icons.cjs collect <map.json> <out dir>');
  console.error('세트: ' + Object.keys(SETS).join(', '));
  process.exit(2);
}

const pkgVersion = (name) => {
  try {
    return JSON.parse(fs.readFileSync(require.resolve(name + '/package.json', { paths: [process.cwd()] }), 'utf8')).version;
  } catch {}
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    return { ...pj.devDependencies, ...pj.dependencies }[name] || null;
  } catch { return null; }
};

// Returns { root, version, license, source } for a set's SVG package.
function resolveSet(set, vendor, pinned) {
  const s = SETS[set];
  try {
    const pj = require.resolve(s.pkg + '/package.json', { paths: [process.cwd()] });
    const meta = JSON.parse(fs.readFileSync(pj, 'utf8'));
    return { root: path.dirname(pj), version: meta.version, license: meta.license, source: '프로젝트' };
  } catch {}
  const want = pinned || (s.react && pkgVersion(s.react)) || 'latest';
  const dest = path.join(vendor, s.pkg.replace(/[@/]/g, '_') + '@' + want);
  if (!fs.existsSync(path.join(dest, 'package', 'package.json'))) {
    fs.mkdirSync(dest, { recursive: true });
    let tgz;
    try {
      tgz = execFileSync('npm', ['pack', `${s.pkg}@${want}`, '--silent', '--pack-destination', dest],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 }).trim().split('\n').pop();
    } catch (e) {
      throw new Error(`${s.pkg}@${want}를 받지 못했습니다: ${String(e.stderr || e.message).trim().split('\n').pop()}`);
    }
    execFileSync('tar', ['xzf', path.join(dest, tgz), '-C', dest]);
    fs.rmSync(path.join(dest, tgz));
  }
  const meta = JSON.parse(fs.readFileSync(path.join(dest, 'package', 'package.json'), 'utf8'));
  const source = pinned ? `받음 (지정한 버전 ${pinned})` : want === 'latest' ? '받음' : `받음 (프로젝트의 ${s.react} ${want}에 맞춤)`;
  return { root: path.join(dest, 'package'), version: meta.version, license: meta.license, source };
}

function names(set, info, o) {
  const dir = path.join(info.root, dirOf(set, o));
  let files;
  try { files = fs.readdirSync(dir); } catch { throw new Error(`${set}: ${dir} 폴더가 없습니다. 스타일이나 굵기 값을 확인하세요.`); }
  const suffix = path.basename(SETS[set].file('x', o)).slice(1);   // ".svg", "-bold.svg", "-fill.svg"
  return files.filter(f => f.endsWith(suffix)).map(f => f.slice(0, -suffix.length))
    .filter(n => !(set === 'material' && !o.fill && n.endsWith('-fill')));
}

function readSvg(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<\?xml[^>]*>/, '').trim();
  const open = raw.match(/<svg\b[^>]*>/)[0];
  const attr = (k) => (open.match(new RegExp(`\\s${k}="([^"]*)"`)) || [])[1];
  const viewBox = attr('viewBox') || '0 0 24 24';
  const stroke = attr('stroke'), sw = attr('stroke-width');
  const drawn = stroke && stroke !== 'none' ? 'stroke' : 'fill';
  // Keep only what draws: drop size, class and ids so the board decides the size.
  let head = open.replace(/\s(width|height|class|id|aria-[\w-]+|data-[\w-]+)="[^"]*"/g, '');
  // A file with neither fill nor stroke paints black; make it follow the text color.
  if (!attr('fill') && !stroke) head = head.replace('<svg', '<svg fill="currentColor"');
  return { svg: raw.replace(open, head).replace(/\s+/g, ' '), viewBox, drawn, strokeWidth: sw ? Number(sw) : null };
}

const near = (list, name) => {
  const words = String(name).split(/[-_]/).filter(w => w.length > 2);
  return list.filter(n => words.some(w => n.includes(w))).slice(0, 6);
};

const VENDOR = path.join(__dirname, 'icons', 'vendor');
const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'find') {
  const [set, ...words] = rest;
  if (!SETS[set] || !words.length) usage(SETS[set] ? '찾을 낱말을 적으세요.' : `모르는 세트입니다: ${set}`);
  try {
    const info = resolveSet(set, VENDOR);
    const all = names(set, info, {});
    const hits = {};
    for (const raw of words) {
      const w = raw.toLowerCase();
      const rank = (n) => (n === w ? 0 : n.startsWith(w) || n.startsWith(w + '-') ? 1 : 2);
      hits[raw] = all.filter(n => n.includes(w)).sort((a, b) => rank(a) - rank(b) || a.length - b.length).slice(0, 15);
    }
    console.log(JSON.stringify({ set, version: info.version, total: all.length, hits }, null, 1));
  } catch (e) { console.error(e.message); process.exit(1); }
} else if (cmd === 'collect') {
  const [mapFile, out] = rest;
  if (!mapFile || !out) usage();
  let map;
  try { map = JSON.parse(fs.readFileSync(mapFile, 'utf8')); } catch (e) { usage('map.json을 읽지 못했습니다: ' + e.message); }
  const sets = Object.keys(map.sets || {});
  const unknown = sets.filter(s => !SETS[s]);
  if (!sets.length || unknown.length) usage(unknown.length ? `모르는 세트입니다: ${unknown.join(', ')}` : 'sets가 비어 있습니다.');
  if (!Array.isArray(map.concepts) || !map.concepts.every(c => c.id && /^[\w-]+$/.test(c.id))) {
    usage('concepts는 id(영문, 숫자, -, _)가 있는 항목의 목록이어야 합니다.');
  }
  fs.mkdirSync(out, { recursive: true });
  const report = { sets: {}, concepts: map.concepts.length, issues: [] };
  for (const set of sets) {
    const o = map.sets[set] || {};
    let info;
    try { info = resolveSet(set, VENDOR, o.version); } catch (e) { report.issues.push(e.message); continue; }
    let all;
    try { all = names(set, info, o); } catch (e) { report.issues.push(e.message); continue; }
    const icons = {}, missing = [];
    let drawn = null, sw = null, vb = null;
    for (const c of map.concepts) {
      const n = (c.names || {})[set];
      const f = n && path.join(info.root, SETS[set].file(n, o));
      if (!n || !fs.existsSync(f)) {
        missing.push({ id: c.id, label: c.label || c.id, name: n || null, near: n ? near(all, n) : [] });
        continue;
      }
      const r = readSvg(f);
      icons[c.id] = r.svg;
      drawn ??= r.drawn; sw ??= r.strokeWidth; vb ??= r.viewBox;
    }
    const grid = vb ? Number(vb.split(/\s+/)[2]) : 24;
    const ratio = sw ? sw / grid : SETS[set].nominal ? SETS[set].nominal(o) : null;
    const at = (px) => (ratio ? Math.round(ratio * px * 100) / 100 : null);
    const js = `// ${set} ${info.version} (${info.license}), gathered by icons.cjs\n` +
      `(window.dhIcons = window.dhIcons || {})[${JSON.stringify(set)}] = ${JSON.stringify(icons)};\n` +
      `(() => { const set = ${JSON.stringify(set)};\n` +
      `  const put = () => document.querySelectorAll('[data-ic]').forEach(el => {\n` +
      `    const s = window.dhIcons[set][el.dataset.ic], size = el.dataset.size || 24;\n` +
      `    const t = document.createElement('template');\n` +
      `    t.innerHTML = s ? s.replace('<svg', '<svg class="ic" width="' + size + '" height="' + size + '" aria-hidden="true"')\n` +
      `      : '<span class="ic-miss" style="display:inline-grid;place-items:center;width:' + size + 'px;height:' + size + 'px;font-size:9px">없음</span>';\n` +
      `    el.replaceWith(t.content.firstChild); });\n` +
      `  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', put); else put(); })();\n`;
    fs.writeFileSync(path.join(out, `${set}.js`), js);
    report.sets[set] = { version: info.version, license: info.license, source: info.source, options: o,
      file: path.join(out, `${set}.js`), found: Object.keys(icons).length, missing,
      drawn: drawn || null, grid, strokeAt: { 16: at(16), 20: at(20), 24: at(24) } };
  }
  report.ok = report.issues.length === 0;
  console.log(JSON.stringify(report, null, 1));
  if (!report.ok) process.exitCode = 1;
} else {
  usage(cmd ? `모르는 명령입니다: ${cmd}` : '');
}
