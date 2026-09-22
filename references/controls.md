# Controls

The sheet is interactive. Scrubbing a ladder, switching background, pinning a specimen
and recording a choice all happen **in the browser, with no turn of mine in between.**

**What controls may move — the whole guardrail:**

- the **window** of the axis that was ordered (centre, spacing, snap)
- the **context** it is judged in (background, repetition, size, content)

**Nothing else.** A colour picker on a spacing ladder turns this into a toy and the
measurement dies with it. The one exception is the blank-slate matrix — two axes by
construction, `references/sweeping.md`.

## Config — what I write per section

One object, `L`, keyed by section id, in a `<script>` **before** the engine. Section
ids stay short and selector-safe: `u1`, `u2`, `m1`.

```js
const L = {
  u3: {
    kind: 'ladder',
    axes: [{ scale: [2,4,8,12,16,24], n: 5, center: 3, spread: 1, step: 1, unit: 'px' }],
    inSystem: [4,8,12,16],
    token: '--shadow-blur-md', uses: 23,
    resolve: v => `검정 12% · 번짐 ${v}px`,
    eye: v => v >= 20 ? '여기서부터 떠 보입니다' : '',
    draw: (el, v) => el.style.setProperty('--blur', v + 'px'),
  },
};
```

- `scale` — the ladder's candidate values, **in order**. The project's own scale when
  detection found one, otherwise the default ladder in `references/sweeping.md`.
  Entries may be numbers or class names; see the utility fork below
- `inSystem` — which of them exist as a token or utility today. `'all'` when every
  entry does. This is what the cost chip reads
- `token` · `uses` — the token this axis hangs off and its grep count. **`token: null`
  on a blank slate** and the chip disappears, which is correct — there is no cost to
  show when nothing is being changed
- `resolve` · `eye` — **functions of the value, never per letter**
  (`references/sweeping.md`)
- `draw` — applies the value to a clone. Set a CSS variable the specimen's own CSS
  reads. Never write a full style string here

### The utility fork

With Tailwind the specimen carries a class, not a value. `scale` becomes class names and
`draw` swaps them. Everything else is unchanged — the engine indexes the array, so it
never does arithmetic on the entries.

**Mark the component node `target` in the template.** `draw` receives the wrapper, and
the wrapper holds every context block — the backgrounds, the sizes, the repetition. A
variable set on it reaches the component by inheritance; **a class does not.** It has to
be put on each component node by hand, and there is more than one of them.

```js
axes: [{ scale: ['rounded-none','rounded-sm','rounded','rounded-md','rounded-lg'],
         n: 5, center: 2, spread: 1 }],
inSystem: 'all',
draw: (el, c) => el.querySelectorAll('.target').forEach(t => {
  t.className = t.className.replace(/\brounded\S*/g, '').replace(/\s+/g, ' ').trim() + ' ' + c;
}),
```

Getting this wrong **fails silently and looks fine**: the class lands on the wrapper, the
component keeps whatever it was born with, and every rung renders identically. Nothing
throws. Verification step 2 in `SKILL.md` is what catches it — read the computed style
off the component and confirm the rungs actually differ.

Free mode is numeric only, so the `스케일에 맞춤` checkbox hides itself here.

## Snap — off-scale is reachable, never free and never silent

`스케일에 맞춤` is **on by default.** Snapped, the window walks the scale's own steps and
every rung is a value the project already has: `토큰 그대로`.

Off, rungs are continuous — `step` apart — and any rung that isn't on the scale flips
its chip:

    토큰 그대로            →    --shadow-blur-md 고침 (23곳) · 또는 새 토큰

and draws a dashed outline.

## Markup

```html
<div id="tray">
  <div class="chip"><!-- 현재 코드값 --></div>
  <div class="chip"><!-- 직전 확정 --></div>
</div>

<div class="ctx">
  <button data-ctx="bg" data-val="pair">흰·회</button>
  <button data-ctx="bg" data-val="dark">다크</button>
  <button data-ctx="rep" data-val="many">6개</button>
  <button data-ctx="rep" data-val="one">1개</button>
  <button data-ctx="size" data-val="both">두 크기</button>
  <button data-ctx="size" data-val="sm">작은 것만</button>
  <button data-ctx="size" data-val="lg">큰 것만</button>
</div>

<section id="u3" data-kind="ladder" data-axis="그림자 블러">
  <h2>그림자 블러</h2>
  <div class="scrub">
    <label>창 <input type="range" data-scrub="center:0"></label>
    <label>간격 <input type="range" data-scrub="spread:0" min="1" max="3"></label>
    <label><input type="checkbox" data-scrub="snap"> 스케일에 맞춤</label>
  </div>
  <template>
    <div class="on-white rep">…the real component, marked `target`, repeated…</div>
    <div class="on-gray rep">…</div>
    <div class="on-dark rep">…only when the project has a dark surface…</div>
  </template>
  <div class="ladder"></div>
  <p class="edge">경계 — B·C 는 이 크기에서 구분이 안 됩니다.</p>
</section>
```

The `<template>` holds the specimen **once** — every context (both backgrounds, both
sizes, the repetition) lives inside it and CSS shows or hides them. The engine stamps it
per rung. `data-scrub="center:0"` is `<what>:<axis index>`; a ladder has one axis, the
matrix has two.

`id="latest"` and one `<section>` per ladder still hold — `references/liveview.md`
counts them to land the reload in the right place.

## A ladder that doesn't fit isn't a ladder

**Never let a comparison scroll sideways** — two specimens that can't be on screen
together are compared from memory, which is the one thing this tool exists to avoid.

When it doesn't fit, take the width out of the **context, never out of the rungs**:
one background instead of two, `1개` instead of `6개`, the small size only. Dropping to
three rungs to make room is the wrong trade — the neighbours are the measurement.

## The boundary goes stale, the captions don't

The engine dims a boundary whose window moved and appends `— 창을 옮겼습니다. 경계는
다시 봐야 합니다`. It comes back on its own if the window returns.

**That dimming is an order to me, not to the user:** next turn, look again and rewrite
the line. Never leave a dimmed boundary standing while reporting as if it held.

## The pin tray

`핀` clones a specimen into the sticky tray at the top. It survives reloads and it
crosses sections, so a radius rung can sit beside a shadow settled forty minutes ago.
Click a pinned chip to drop it.

Seed the tray at build time with reference points, never with taste:

    현재 코드값 · 시스템 기본 · 직전 확정

Those are facts. A row of looks I invented is a preset gallery — `SKILL.md` rules it out.

## Recording a choice

`이걸로 확정` POSTs one line to `$WS/state.jsonl` — `references/liveview.md` has the
server that accepts it.

```json
{"at":"2026-09-23T04:11:02.884Z","kind":"choice","axis":"그림자 블러","letter":"C",
 "value":[12],"context":{"bg":"pair","rep":"many","size":"both"},
 "window":{"snap":true,"axes":[{"center":3,"spread":1}],"extra":[]}}
```

**Only `이걸로 확정` exists.** There is no `괜찮네` button and there never will be one —
an impression is not a choice.

`kind` is `choice` on a ladder and `anchor` on the matrix — `여기서 시작`, an anchor is
not a decision. `references/sweeping.md`.

A failed POST flashes `기록 실패 — 채팅으로 알려주세요` and nothing is lost; the user
says it in chat as before.

## The engine

Paste as-is, after the `L` block, before the reloader.

```html
<script>
(() => {
  const S = sessionStorage, $ = (s, r = document) => [...r.querySelectorAll(s)];
  const load = (k, d) => { try { return JSON.parse(S.getItem(k)) ?? d } catch { return d } };
  const save = (k, v) => { try { S.setItem(k, JSON.stringify(v)) } catch {} };
  const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', state = {}, pins = load('pins', []);
  const ctx = load('ctx', { bg: 'pair', rep: 'many', size: 'both' });

  const syncCtx = () => {
    Object.assign(document.documentElement.dataset, ctx);
    $('[data-ctx]').forEach(b => b.setAttribute('aria-pressed', ctx[b.dataset.ctx] === b.dataset.val));
    save('ctx', ctx);
  };

  const rungs = (a, st, snap) => {
    const span = (a.n - 1) * st.spread, out = [];
    if (snap) {
      let s = Math.round(st.center - span / 2);
      s = Math.max(0, Math.min(a.scale.length - 1 - span, s));
      for (let i = 0; i < a.n; i++) out.push(a.scale[s + i * st.spread] ?? a.scale.at(-1));
    } else {
      const c = a.scale[Math.round(st.center)];
      for (let i = 0; i < a.n; i++) out.push(+(c + (i - (a.n - 1) / 2) * st.spread * a.step).toFixed(4));
    }
    return out;
  };

  const flash = t => {
    let el = document.getElementById('flash');
    if (!el) { el = document.createElement('div'); el.id = 'flash'; document.body.append(el); }
    el.textContent = t; el.classList.add('on');
    clearTimeout(el.t); el.t = setTimeout(() => el.classList.remove('on'), 2400);
  };

  const post = o => fetch('/state', { method: 'POST', body: JSON.stringify({ at: new Date().toISOString(), ...o }) })
    .then(r => flash(r.ok ? '확정 기록됨' : '기록 실패 — 채팅으로 알려주세요'))
    .catch(() => flash('기록 실패 — 채팅으로 알려주세요'));

  const cap = (cf, letter, vals, extra) => {
    const txt = vals.map((x, k) => x + (cf.axes[k].unit || '')).join(' · ');
    const inSys = cf.inSystem === 'all' || vals.every(x => (cf.inSystem || []).includes(x));
    const c = document.createElement('figcaption');
    c.innerHTML =
      `<b>${letter}</b> <span class="val">${txt}</span>` +
      (extra ? ' <span class="add">추가</span>' : '') +
      (cf.token ? ` <span class="cost${inSys ? '' : ' off'}">${inSys ? '토큰 그대로'
        : `${cf.token} 고침 (${cf.uses}곳) · 또는 새 토큰`}</span>` : '') +
      `<p class="resolved">${cf.resolve ? cf.resolve(...vals) : ''}</p>` +
      `<p class="eye">${cf.eye ? cf.eye(...vals) : ''}</p>` +
      `<div class="acts"><button class="pin">핀</button>` +
      `<button class="pick">${cf.kind === 'matrix' ? '여기서 시작' : '이걸로 확정'}</button></div>`;
    return c;
  };

  const edge = id => {
    const p = document.querySelector('#' + id + ' .edge'); if (!p) return;
    const now = JSON.stringify(state[id]);
    if (!p.dataset.window) p.dataset.window = now;
    p.classList.toggle('stale', p.dataset.window !== now);
  };

  const build = id => {
    const cf = L[id], sec = document.getElementById(id), st = state[id];
    const box = sec.querySelector('.ladder'), tpl = sec.querySelector('template');
    const cols = cf.axes.map((a, k) => rungs(a, st.axes[k], st.snap));
    const combos = cols.length === 1 ? cols[0].map(v => [v])
                 : cols[0].flatMap(r => cols[1].map(c => [r, c]));
    const list = [...combos, ...st.extra];
    box.style.setProperty('--cols', cols.length === 1 ? cols[0].length : cols[1].length);
    box.textContent = '';
    list.forEach((vals, i) => {
      const fig = document.createElement('figure');
      fig.className = 'spec'; fig.tabIndex = 0;
      fig.dataset.letter = LET[i] || '?';
      fig.dataset.vals = JSON.stringify(vals);
      const body = document.createElement('div');
      body.className = 'body';
      body.append(tpl.content.cloneNode(true));
      fig.append(body, cap(cf, LET[i], vals, i >= combos.length));
      cf.draw(body, ...vals);
      box.append(fig);
    });
    edge(id);
  };

  const paintPins = () => {
    const tray = document.getElementById('tray'); if (!tray) return;
    $('.chip.mine', tray).forEach(e => e.remove());
    pins.forEach(p => {
      const fig = document.querySelector('#' + p.sec + ' [data-letter="' + p.letter + '"]'); if (!fig) return;
      const d = document.createElement('div'); d.className = 'chip mine';
      d.append(fig.querySelector('.body').cloneNode(true));
      const l = document.createElement('small');
      l.textContent = document.getElementById(p.sec).dataset.axis + ' ' + p.letter;
      d.append(l);
      d.onclick = () => { pins.splice(pins.indexOf(p), 1); save('pins', pins); paintPins(); };
      tray.append(d);
    });
  };

  const commit = id => { save('ctl:' + id, state[id]); build(id); paintPins(); };

  $('[data-ctx]').forEach(b => b.onclick = () => { ctx[b.dataset.ctx] = b.dataset.val; syncCtx(); });
  syncCtx();

  $('section[data-kind]').forEach(sec => {
    const cf = L[sec.id]; if (!cf) return;
    const st = state[sec.id] = load('ctl:' + sec.id, {
      snap: true, extra: [], axes: cf.axes.map(a => ({ center: a.center, spread: a.spread })),
    });
    $('[data-scrub]', sec).forEach(inp => {
      const [what, k] = inp.dataset.scrub.split(':');
      if (what === 'snap') {
        if (typeof cf.axes[0].scale[0] !== 'number') { inp.closest('label').hidden = true; st.snap = true; }
        inp.checked = st.snap;
        inp.onchange = () => { st.snap = inp.checked; commit(sec.id); };
        return;
      }
      if (what === 'center') inp.max = cf.axes[+k].scale.length - 1;
      inp.value = st.axes[+k][what];
      inp.oninput = () => { st.axes[+k][what] = +inp.value; commit(sec.id); };
    });
    build(sec.id);
  });
  paintPins();

  document.addEventListener('click', e => {
    const b = e.target.closest('.pin, .pick'); if (!b) return;
    const fig = b.closest('.spec'), sec = fig.closest('section'), cf = L[sec.id];
    if (b.classList.contains('pin')) {
      if (!pins.some(p => p.sec === sec.id && p.letter === fig.dataset.letter))
        pins.push({ sec: sec.id, letter: fig.dataset.letter });
      save('pins', pins); paintPins(); return;
    }
    post({
      kind: cf.kind === 'matrix' ? 'anchor' : 'choice',
      axis: sec.dataset.axis, letter: fig.dataset.letter,
      value: JSON.parse(fig.dataset.vals), context: { ...ctx }, window: state[sec.id],
    });
    $('.spec.picked').forEach(x => x.classList.remove('picked'));
    fig.classList.add('picked');
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const fig = e.target.closest && e.target.closest('.spec'); if (!fig) return;
    const sec = fig.closest('section'), cf = L[sec.id], a = cf.axes[0];
    if (cf.axes.length > 1 || typeof a.scale[0] !== 'number') return;
    e.preventDefault();
    const nv = +(JSON.parse(fig.dataset.vals)[0] + (e.key === 'ArrowUp' ? 1 : -1) * a.step).toFixed(4);
    const st = state[sec.id];
    if (!st.extra.some(x => x[0] === nv)) st.extra.push([nv]);
    commit(sec.id);
  });
})();
</script>
```

## The style

```css
:root { color-scheme: dark }
body { margin:0; padding:24px; background:#111; color:#ddd;
       font:14px/1.6 system-ui, -apple-system, sans-serif }
.val, .cost, .add { font-family: ui-monospace, SFMono-Regular, monospace }

#tray { position:sticky; top:0; z-index:9; display:flex; gap:12px; overflow-x:auto;
        padding:12px; margin:-24px -24px 24px; background:#181818;
        border-bottom:1px solid #2a2a2a }
#tray .chip { flex:0 0 auto; text-align:center }
#tray .chip small { display:block; color:#888; margin-top:4px }

.ctx { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:32px }
.ctx button, .acts button { background:#222; color:#ccc; border:1px solid #3a3a3a;
        border-radius:4px; padding:3px 8px; font-size:12px; cursor:pointer }
.ctx button[aria-pressed="true"] { background:#2f3a44; color:#eee; border-color:#4a5a66 }

section { margin:48px 0; overflow-x:auto }
.scrub { display:flex; gap:16px; align-items:center; color:#999; margin:8px 0 16px }
.ladder { display:grid; grid-template-columns:repeat(var(--cols,1), minmax(0,1fr)); gap:24px }
.spec { margin:0 }
.spec:focus-visible { outline:1px solid #555; outline-offset:8px }
.spec.picked figcaption b { color:#7ec8ff }
figcaption { margin-top:12px; color:#999 }
figcaption b { color:#eee; margin-right:6px }
.cost { color:#6a9c6a }
.cost.off { color:#d9a441 }
.spec:has(.cost.off) .body { outline:1px dashed #d9a441; outline-offset:6px }
.add { color:#888; border:1px solid #444; padding:0 4px; border-radius:3px }
.resolved, .eye { margin:4px 0 0 }
.acts { margin-top:8px; display:flex; gap:6px }
.edge { color:#aaa; margin-top:16px }
.edge.stale { opacity:.45 }
.edge.stale::after { content:' — 창을 옮겼습니다. 경계는 다시 봐야 합니다' }

#flash { position:fixed; right:16px; bottom:16px; background:#222; padding:8px 12px;
         border:1px solid #3a3a3a; border-radius:6px; opacity:0; transition:opacity .2s }
#flash.on { opacity:1 }

html[data-bg="pair"] .on-dark { display:none }
html[data-bg="dark"] .on-white, html[data-bg="dark"] .on-gray { display:none }
html[data-rep="one"] .rep > * + * { display:none }
html[data-size="sm"] .lg, html[data-size="lg"] .sm { display:none }
```
