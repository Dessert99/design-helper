# Drawing specimens

## Candidate scales

These are reference values to sample, not a required number of specimens. Prefer the
project's scale and the user's requested count. Otherwise show only the distinct
alternatives useful to this question; omit redundant steps and expand when requested.
If the desired breadth is unclear, follow the one-time count question in `SKILL.md`.

| property | ladder |
|---|---|
| radius | 0 · 2 · 4 · 6 · 8 · 12 · 16 |
| shadow blur | 2 · 4 · 8 · 12 · 16 · 24 |
| shadow alpha | .04 · .06 · .08 · .12 · .16 |
| border width | 0.5 · 1 · 1.5 · 2 · 3 |
| spacing | 4 · 8 · 12 · 16 · 20 · 24 · 32 |
| font size | 12 · 13 · 14 · 16 · 18 · 20 |
| line height | 1.2 · 1.35 · 1.5 · 1.6 · 1.75 |
| letter spacing | -0.02 · -0.01 · 0 · 0.01 · 0.02em |
| opacity | .4 · .55 · .7 · .85 · 1 |
| blur (backdrop) | 4 · 8 · 12 · 20 · 32 |

When the project has a scale, **use its steps, not these.** The point of a ladder in a
tokenized project is to find which existing step fits, not to invent a new one.

When comparing two directions together is useful, a matrix can put one on rows and
the other on columns, both labeled. Choose useful dimensions; do not automatically
expand every possible combination. For a blank-slate opener, see below.

## Fixed candidates first

Each row above is a scale. Choose useful, distinct steps around the current project value,
or the middle when none exists, and render them as fixed, lettered specimens.
No slider or keyboard nudging is needed. `C에서 조금 더 크게` means append a refined
ladder in chat, preserving earlier specimens and continuing their letters.

Only add direct range adjustment when it meets the optional-controls criteria in
`references/controls.md`. The engine's `scale`, `center`, `n`, and `spread` fields are
implementation details for that mode, not controls every sheet must expose.

## Captions — the sheet explains itself

The user reads the screen, not the chat. Everything needed to judge a specimen sits
next to it.

Three lines per specimen:

```
A   x1.8                                        토큰 그대로
    윗변 100% · 그림자 100%
    가장 세게 번집니다. B 와 그림자가 같아 한 쌍으로 붙습니다.
```

1. letter · the value being moved · its cost
2. what that value resolves to, when the value alone doesn't show it
3. one line on what it does to the eye

Under the ladder, where the perceptual steps break:

```
경계 — B·C 는 이 크기에서 구분이 안 됩니다. E 부터 떠 보이기 시작합니다.
```

### The section guide

Every section opens, under its title, with a short guide telling the user what this
section asks of them. Three fixed labels, each one or two full sentences — enough that
someone who skipped the chat can still judge the section without guessing:

```
정할 것 — 공지 뒤에 깔리는 선택 표시의 가로 폭을 정합니다. K 는 칸 폭을 그대로
          따라가서 화면이 넓어질수록 길어지고, L 은 어느 화면에서든 46 으로 고정됩니다.
볼 곳   — 390 과 480 열에서 공지 뒤 면의 가로 길이를 비교해 보세요. 480 에서 K 는
          L 보다 약 1.6 배 넓습니다. 320 에서는 칸이 47 이라 둘이 거의 같아 보입니다.
답하기  — 채팅에 글자로 알려주세요. 하나로 정하셨다면 "L 로 갈게", 방향은 좋은데
          조금 다르게 보고 싶다면 "K 에서 더 좁게" 처럼 말씀하시면 됩니다.
```

1. `정할 것` — the one decision this section exists for, in plain words: what is being
   decided and how the lettered options differ in behavior, not only in value. Only
   the ordered axis — never a next axis
2. `볼 곳` — where on the specimens the difference shows, at which size or background
   it shows most, and roughly how big it is. Say where it doesn't show, too, so the
   user doesn't stare at identical columns
3. `답하기` — how to answer in chat, with one choice and one refine example using this
   section's real letters

Plain sentences, not fragments — the user reads this cold. Keep each label to two
sentences; anything longer belongs in the specimen captions.

This is a reading guide, not a recommendation. It never ranks the options or leans
toward one. It sits above the specimens; the boundary line stays below them.

### Turn dividers

A sheet grows over several chat turns. Everything appended in response to one user
message sits under one divider, so the user can tell which turn produced what:

```
요청 2 · 화살표 비교와 도크 전체  ------------------------------
  화살표 크기 — 16 vs 20 vs 24
  도크 전체 — 높이·모서리
```

- `요청 N ·` and a few words of what was asked, the same words as the table-of-contents
  turn label. Label on the left, heavier rule, the widest gap on the page.
- Every turn that appends gets one, including a refine that continues an earlier
  section's letters. An in-place revision of an existing section adds none.
- **Section titles start with the element's name**, as the user calls it —
  `화살표 크기 — ...`, `도크 전체 — ...`. That is what separates two elements inside one turn;
  there is no separate element divider.
- `<div class="turn">`, never a `<section>` — the reloader counts sections.

### The table of contents

A fixed sidebar on the left lists every turn and, under it, the titles of the sections
that turn added. It gives a long sheet a way back to any earlier comparison.

```
목차
요청 1 · 시트가 화면 폭을 쓰는 방식
  시트 폭 — 시안 칸을 화면에 어떻게 채울지
요청 2 · 요청별 목차 사이드바
  사이드바 폭 — 고정 폭을 얼마로 둘지
```

- **Contents only.** Turn labels (the same words as the turn divider) and section
  titles, each linking to its section. No chosen values, no status, no next steps.
- **220 wide, always open.** No collapse toggle and no breakpoint that hides it — the
  page body keeps one stable width, so the specimen grid never reflows under the user.
  The body takes the rest.
- **Sticky, scrolls on its own.** It stays in view while the page scrolls; a long list
  scrolls inside the sidebar.
- **The section in view is highlighted.** Only the reading position — never a choice.
- Every `<section>` gets a stable id, `r<turn>-<n>` (`r2-1`), for the links. The sidebar
  is a `<nav>`, never a `<section>` — the reloader counts sections.

```html
<body class="has-toc">
  <nav class="toc">
    <div class="toc-h">목차</div>
    <div class="toc-turn">요청 1 · 시트가 화면 폭을 쓰는 방식</div>
    <a href="#r1-1">시트 폭 — 시안 칸을 화면에 어떻게 채울지</a>
  </nav>
  <main> <div class="turn">...</div> <section id="r1-1">...</section> </main>
</body>
```

```css
.has-toc { display:flex; align-items:flex-start }
.has-toc > main { flex:1; min-width:0 }
.toc { flex:none; width:220px; position:sticky; top:0; height:100vh; overflow-y:auto;
       padding:28px 16px; background:var(--surface); border-right:1px solid var(--line);
       font-size:12px }
.toc-h { font-size:11px; font-weight:700; color:var(--muted); letter-spacing:.04em; margin:0 0 14px }
.toc-turn { font-weight:700; font-size:12.5px; margin:16px 0 4px }
.toc a { display:block; color:var(--sub); text-decoration:none; padding:4px 8px;
         margin-left:-8px; border-radius:6px }
.toc a.cur { background:var(--accent-tint); color:var(--accent); font-weight:600 }
```

```html
<script>
(() => {
  const links = [...document.querySelectorAll('.toc a')];
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle('cur', a.hash === '#' + e.target.id));
  }), { rootMargin: '0px 0px -70% 0px' });
  document.querySelectorAll('section[id]').forEach(s => io.observe(s));
})();
</script>
```

The `var(--...)` tokens are the sheet style's — `#sheet-style`.

### Filling the width

Lay a section's specimens on a grid that shares the page width among its cells, so no
empty band is left on the right however wide the window is:

```css
.grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(380px, 1fr)); gap:36px 28px }
.frame { display:flex; justify-content:center }   /* specimen stays at true size */
```

Only the frame stretches. The specimen inside keeps its real pixel size, centered —
never scale or `zoom` it to fill the cell, because size is part of what is judged.
Set the minimum from the specimen's real width plus the frame padding (a 320 screen →
380). A matrix, whose columns carry meaning, keeps its fixed column count instead.

### Sheet style

The sheet's own chrome — page, sidebar, guide, frames, captions — is one fixed look:
white cells floating on a light gray page, and one blue for the reading path. It
belongs to the sheet, not to the specimens.

- **Cells float.** Specimen frames and the guide box are white with a faint two-layer
  shadow and radius 14, so a specimen reads first without a line around every cell.
- **One accent, on the reading path only.** Blue marks the letter badge, the guide
  labels and the current table-of-contents item. It never goes
  inside a frame or next to a specimen's surface, where it would bias a color judgment.
- **Neutral behind specimens.** The frame stays white. When the ordered axis is itself
  surface or background, the specimen's context rules (`#context`) override the frame.

```css
:root {
  --page:#f1f1f3; --surface:#ffffff; --line:#e7e7ea; --ink:#1f1f23; --sub:#63636b;
  --muted:#8b8b93; --accent:#3b5bdb; --accent-tint:rgba(59,91,219,.10); --radius:14px;
  --float:0 1px 2px rgba(0,0,0,.05), 0 6px 20px rgba(0,0,0,.06);
}
*, *::before, *::after { box-sizing:border-box }
body { margin:0; background:var(--page); color:var(--ink);
       font:13px/1.6 -apple-system, "Pretendard", "Apple SD Gothic Neo", sans-serif }
main { padding:8px 44px 64px }

.turn { display:flex; align-items:center; gap:16px; margin:72px 0 0;
        font-size:14px; font-weight:700; color:var(--ink) }
.turn::after { content:""; flex:1; height:2px; background:#d4d4d9; border-radius:1px }
main > .turn:first-child { margin-top:32px }

section h2 { font-size:20px; letter-spacing:-.01em; margin:22px 0 6px }
.desc { color:var(--sub); margin:0 0 16px; max-width:820px }
.guide { display:grid; grid-template-columns:auto 1fr; gap:6px 14px; max-width:820px;
         margin:0 0 26px; padding:14px 18px; background:var(--surface);
         border:1px solid rgba(0,0,0,.04); border-radius:var(--radius); box-shadow:var(--float) }
.guide b { color:var(--accent); white-space:nowrap }

.frame { background:var(--surface); border:1px solid rgba(0,0,0,.04);
         border-radius:var(--radius); box-shadow:var(--float); padding:18px 14px; overflow:hidden }
.cap { margin-top:12px }
.cap .n { display:flex; align-items:center; gap:8px; font-weight:700 }
.badge { display:inline-grid; place-items:center; min-width:22px; height:22px; padding:0 6px;
         border-radius:6px; background:var(--accent); color:#fff; font-size:12px; font-weight:700 }
.cost { margin-left:auto; font-size:11.5px; font-weight:500; padding:1px 8px;
        border-radius:99px; background:var(--page); color:#52525b }
.cap p { margin:2px 0 0 } .cap .resolved { color:var(--muted) }
.bound { color:var(--sub); margin:18px 0 0 }
```

```html
<div class="spec">
  <div class="frame">...specimen...</div>
  <div class="cap">
    <div class="n"><span class="badge">A</span>두께 얇음 · 모서리 각짐<span class="cost">새 변수</span></div>
    <p class="resolved">높이 52 · 안쪽 여백 0 · 모서리 14</p>
    <p>면이 적어 콘텐츠가 더 보입니다.</p>
  </div>
</div>
```

**For optional interactive sheets**, write lines 2 and 3 as functions of the value,
never per letter. The boundary line is written per letter, so a changed window makes
it stale. Fixed sheets keep stable captions and letters.

Then chat is a pointer, not the explanation — two or three lines at most. A paragraph
per specimen in chat means the sheet was written wrong.

## Context

A specimen judged in the wrong context is judged wrong.

**Backgrounds — at least two.** Shadow, border, opacity and blur all invert with the
surface behind them. White and gray at minimum; dark too if the project has it.

**Repeat the element.** One button never reveals a shadow. Lay six in a list and
"too heavy" becomes obvious. Anything that appears in multiples in the real UI gets
drawn in multiples here.

**Two sizes.** The same radius reads completely differently on a 32px chip and a
400px card. Small and large, always.

**Real content.** Placeholder boxes hide the problem — a card with lorem ipsum and a
card with a real headline, avatar and timestamp are different design problems.

Show background, repetition and size contexts together by default. Context buttons are
optional when isolating a condition materially helps comparison; they do not require
range sliders. Never open a sheet already narrowed just because it looks tidier. Real content is not a toggle: there is no version of this where
lorem ipsum is the right specimen. `references/controls.md`.

### When context is a constraint, not a variable

> "황혼 배경에 어울리는 카드"

The background is now fixed, so the rule inverts: **hold the constraint and draw
everything on top of it.** Don't fall back to the white/gray default.

But a constraint is rarely one value. "황혼" is a range — pick 2–3 points across it
(해 지기 직전 주황 / 푸른 시간대 / 해 넘어간 뒤 남보라) and draw the ladder on each.

**Use the real background.** A gray stand-in makes the whole comparison worthless.

**A constraint rewrites the axes.** On a dusk background a drop shadow barely
registers — dark on dark. The axis that would have been "shadow" becomes "glow", or
"surface brightness", or "border luminance". Work out which axes the constraint
actually leaves alive before laying anything out.

## A blank slate — the coordinate sweep

> "버튼 만들어야 하는데 아직 아무것도 없어"

There is no existing dissatisfaction to diagnose. First clarify purpose and use when
unknown, following `references/clarification.md`; inspect available content and project
conventions yourself. Once enough is known, show starting points instead of asking the
user to specify a look or CSS axis verbally.

**Show enough labeled coordinates to reveal useful directions and let them point.**
Choose the count for the target and the user's desired breadth, following `SKILL.md`.
There is no mandatory 3x3 or nine-cell opener. Use a matrix only when the relationship
between two directions helps; otherwise show a small set of labeled anchor specimens.
These are starting points, not isolated property decisions.

- **Label both edges with what moves and which way** — `무게 — 가벼움 → 무거움`,
  `모서리 — 각짐 → 둥글`. A matrix of finished looks with no labelled edges is a preset
  gallery. Labelled edges are what make `더 오른쪽` mean something, and that is the
  entire difference between the two
- **Name the properties a direction bundles, in the caption** — `무게 = 테두리 굵기 +
  글자 굵기 + 세로 여백`. The user has to be able to reject the coordinate system
  itself. `무게 말고 밀도로 봐줘` is the most useful sentence available here and it
  cannot be said unless the axes are written down
- Letter the displayed specimens from A; the user names a starting point in chat
- `더 오른쪽` in chat requests additional fixed candidates in that direction. A matrix
  does not automatically need sliders — `references/controls.md`

### A cell is an anchor, not a decision

Both directions bundle several properties, so a chosen cell can't say which of them made
it good. Nothing in it is settled.

    출발점: 버튼 = E · 무게 중간 · 모서리 중간   (묶인 속성 전부 미해결)

`출발점:`, never `확정:`. The line is deliberately different — `확정:` is for a value
that was isolated on one axis and seen against its neighbours, and a matrix by
construction never does that.

**Then the blank slate is over.** The next order is an ordinary single-axis ladder drawn
on top of the anchor. The matrix is an opener, not a mode: once per target, and it does
not come back.

### A look exists, but the user wants a different direction

Anchor the exploration in what the code does today and show useful alternatives
around it, with no fixed grid size or candidate count. `references/stylesystems.md` calls this hunting a
different direction — the current value is the one fact on hand, so it belongs in the
middle rather than thrown away.

## Stateful parts — two rows

hover fires one at a time, so two specimens can never be hovered together.

- `실물` — touched directly with the mouse. Judges speed and feel
- `강제 상태` — default · hover · focus · active · disabled pinned by class, laid
  side by side. Contrasts color and lightness by eye

Both rows, always, for anything with states.

**What can't be judged here.** This is a shell that matches in shape only.
State-attribute styling like `data-[open]:` is imitated by hand — the real library
sets those attributes. Focus traps, keyboard nav and screen readers need the real
implementation. Shape and transition are decidable; **correctness of behavior is not.**
Mount/unmount timing is a motion question — `references/motion.md`.

## Wireframes

When the question is structure — layout, column split, sidebar width, content order —
strip everything else.

**Achromatic only. No color, no type styling, no shadow, no radius.** Gray blocks on
white. If a skin is on it, the skin gets judged instead of the structure.

- Block weight carries hierarchy: darker gray = heavier element
- Label blocks with their role (`네비`, `사이드바`, `본문`, `카드`) — not lorem ipsum
- Draw the real breakpoints if width is the question, not one arbitrary viewport
- Keep a real page's worth of content. Three blocks won't show a layout failing

Structure is settled first, skin afterwards — a separate order.
