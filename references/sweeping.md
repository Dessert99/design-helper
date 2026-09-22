# Drawing specimens

## Default ladders

Reach for these so "5가지 버전" is immediate and doesn't drift between sessions.
Trim or shift the window to the target; never widen past 7.

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

Two axes → a matrix. Rows are one axis, columns the other, both labeled on the edges.
On a blank slate that matrix is the opener — see below.

## The ladder is a window

Each row above is a **scale**, not a ladder. The ladder is 5–7 consecutive steps of it,
and the user moves that window themselves — `references/controls.md`. The row goes into
`scale`; `center`, `n` and `spread` decide only what is on screen first.

Open the window around what the code does today when there is a value there, and around
the middle of the scale when there isn't. Getting it slightly wrong is cheap now — one
drag, and no turn of mine in between.

A rung the user adds by nudging (↑/↓ on a specimen) is **appended with the next letter**
and marked `추가`. It never replaces the specimen it came from.

## Captions — the sheet explains itself

The user reads the screen, not the chat. Everything needed to judge a specimen sits
next to it.

Three lines per specimen:

```
A   ×1.8                                        토큰 그대로
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

**Write lines 2 and 3 as functions of the value, never per letter** — letters move when
the window moves, values don't. The boundary line below is the exception and is written
per letter, so it goes stale on a scrub by design.

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

Background, repetition and size are toggles on the sheet, **on at load, together**. The
toggle adds a context — the project's dark surface — or isolates one for a moment,
usually to make a wide ladder fit. Never open a sheet already narrowed because the row
looked tidier that way. Real content is not a toggle: there is no version of this where
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

Nothing on screen, no axis, and the narrowing questions in `SKILL.md` have nothing to
narrow — they work by pulling on a dissatisfaction and there isn't one yet. Asking
`어떤 느낌을 원하세요?` hands the work back to the user; picking an axis myself is the
guess that section rules out. The loop has no input, so it needs a different opener.

**Lay a 3×3 over two perceptual directions and let them point.** Still a ruler, just
with coarser marks.

- **Label both edges with what moves and which way** — `무게 — 가벼움 → 무거움`,
  `모서리 — 각짐 → 둥글`. Nine finished looks with no labelled edges is a preset
  gallery. Labelled edges are what make `더 오른쪽` mean something, and that is the
  entire difference between the two
- **Name the properties a direction bundles, in the caption** — `무게 = 테두리 굵기 +
  글자 굵기 + 세로 여백`. The user has to be able to reject the coordinate system
  itself. `무게 말고 밀도로 봐줘` is the most useful sentence available here and it
  cannot be said unless the axes are written down
- Nine cells, lettered A–I across the rows, each with `여기서 시작`
- `더 오른쪽` is a scrub, not a redraw — `references/controls.md`

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

Same grid, anchored differently: what the code does today goes in the **centre cell** and
the other eight spread around it. `references/stylesystems.md` calls this hunting a
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
