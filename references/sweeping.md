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
| duration | 80 · 120 · 160 · 200 · 300ms |
| blur (backdrop) | 4 · 8 · 12 · 20 · 32 |

When the project has a scale, **use its steps, not these.** The point of a ladder in a
tokenized project is to find which existing step fits, not to invent a new one.

Two axes → a matrix. Rows are one axis, columns the other, both labeled on the edges.

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
