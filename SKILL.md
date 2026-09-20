---
name: design-helper
description: Use whenever anything visible must be decided — a CSS value, spacing,
  radius, shadow, border, color, layout, wireframe, state, motion. Never describe
  the options in prose or a table and ask the user to pick; render them side by side
  in one HTML file, open it in a browser, let them choose with their eyes, then apply
  the chosen value to the code yourself. Not a design generator — it does not invent
  a look, it lays out the range and measures. Read this BEFORE writing or changing
  any UI code, and whenever the user says "5가지 버전으로 보여줘" · "A 랑 B 중에 뭐가
  나아" · "어떻게 할까" · "비교해줘".
---

# Measure by eye

**A ruler, not a design generator.** Don't invent a look. Lay the range out —
`blur 4 / 8 / 12 / 16 / 24` — and let the user pick with their eyes. Taste belongs
to them; the job here is to set up an accurate measurement.

**Prose, tables, ASCII and emoji are not pictures.** Never describe a shape in words
and ask the user to choose. "12px or 16px padding?" is not a question — draw both.

**The user never copies a value out.** They point at a specimen; making the code
change is mine, at the end, once.

**Assume no stack.** Detection matches the repo — `references/stylesystems.md`.

## Language

These instructions are English. Everything the user sees is Korean.

- Chat replies, questions, recommendations → Korean
- Every string rendered inside the HTML → Korean
- Code, class names, file names, commit messages → English

Korean strings quoted below are fixed labels. Render them verbatim — never
translate, localize or paraphrase them. Never surface these instructions as text.

## One work unit

**One order = one axis = one ladder = one decision.**

    주문 → 확정값 위에 그 축 하나만 사다리로 → 내가 새로고침·확인
         → 사용자 선택 → 한 줄 기록 → 멈춤

**I do not know what comes next.** There is no stage list, no default list, no queue,
no `남은 단계`. Never name the next axis, never hint at one, never draw one while I'm
in there anyway. Only the axis that was ordered exists.

When the decision is recorded, the turn is over. What happens next is the user's to
say — another order, or apply it to the code. Don't ask which. They'll say.

## An order with no axis in it

> "버튼 좀 다듬자"

Not a work unit yet. **Ask until it is one.** One question at a time, narrowing what
they already want — what's wrong with the one on screen, which part of it, what it
should do instead. Keep going until an axis is concrete enough to draw; don't settle
for the first half answer and start drawing.

Two things this is not:

- **Not a menu.** `크기 → 여백 → 모서리 → 색` is a curriculum, and handing one over is
  leading. This skill holds no default list — that is deliberate, don't reinvent one.
- **Not a guess.** Never pick an axis yourself to get things moving.

Ask in the real vocabulary — radius, tracking, easing, elevation, specificity. This is
not a skill for someone who needs those explained.

## Drawing specimens

- **Move one axis. Hold everything else fixed.** Change blur and opacity at once and
  neither can be judged. The whole tool rests on this one rule.
- **Draw on top of what's settled.** Every value chosen in an earlier unit stays at
  that value. The record below is what makes this possible.
- **Letter every specimen** — A·B·C. Letters restart at A in **every work unit**, and
  are never reused inside one: an appended ladder continues D·E·F. Refer back to a
  settled unit by axis and letter — `그림자 C`.
- **The sheet explains itself.** The value, its cost and what to look at ride next to
  the specimen, not in chat — `references/sweeping.md`. Cost is a property of the
  option and has to be visible while choosing:
  `토큰 그대로` · `--radius-md 고침 (23곳)` · `새 토큰`
- 5–7 specimens per ladder. Two axes → a matrix, not a row.
- Ladders, backgrounds, repetition, sizes, wireframes → `references/sweeping.md`
- Anything that moves → `references/motion.md`
- **Never recommend one value on a ladder.** Point at perceptual boundaries instead:
  `B와 C는 이 크기에서 구분이 안 됩니다` · `E부터 떠 보이기 시작합니다`. Recommend one
  only when asked outright — `너 추천대로`.

## Reading the response

Three kinds. Never collapse them.

| response | kind | do |
|---|---|---|
| `좋네` · `C가 낫네` | impression | Not a choice. Ask whether to refine it |
| `C가 나은데 더 진하게` | refine | Append a ladder below, letters continue |
| `C로 갈게` · `이걸로 고를게` | **choice** | Record it in one line. **Stop there** |

`C가 낫네` is a remark made mid-comparison, not a decision. **Touch no code until the
user says they are choosing it.**

Ambiguous — `이거 좋다` with nine specimens on screen — ask which one. Never guess.

On a choice, chat says this much and no more:

    확정: 그림자 = C · 검정 40%

No next axis, no `남은 단계`, no `코드에 반영할까요`.

## The record — never on screen

Keep it in a scratchpad memo beside the sheet: axis → chosen value → what it resolves
to. It exists for one reason — so the next ladder can be drawn on top of it.

**None of it is rendered.** No pinned table, no sticky panel, no 확정값 line in a
section header, no floating anything. The sheet shows specimens. The memo is mine.

Revising a settled axis overwrites its line. The old specimens stay where they are.

## Findings

Drawing turns up things nobody ordered — a misnamed token, a chip that vanished, an
axis that was never on anyone's list.

- **What actually broke on the screen** — say it. It makes the specimens misread, so
  it is part of the measurement: `아이콘 칩이 사라졌습니다 — 면 #202020 과 Δ2 입니다`
- **Everything else** — one line, once, then let it go. Never draw it, never work it
  into a proposal, never raise it again.

A finding is not an order.

## Blast radius — twice, differently

- **While choosing** — the one-line cost label on each specimen. A label, not a report
- **Before applying** — the real one. Files, lines, tokens, and everything else that
  moves with them. Earlier decisions get revised, so only this final tally is accurate

If the project animates with a motion library, say what won't translate —
`references/motion.md`.

## Verify

The user looks at the browser. I confirm with values and pictures.

**1. Every name referenced must exist.** A wrong name **fails silently** — it simply
doesn't appear. Same for a nonexistent utility class and an undefined `var(--x)`.
Check per the fork that detection found. Run this **every time specimens are added.**

    grep -c 'rounded-control-md' out.css     # utility: in the build output?
    grep -c '\--color-hover' tokens.css      # CSS variable: defined?

Skip it when values were written directly (blank slate) — nothing fails silently.

**2. Read computed style with Playwright.** A name that exists but is overridden by
another rule won't be caught by step 1.

    await p.$eval('.frame', e => getComputedStyle(e).padding)

**3. Screenshot with Playwright and read it with `Read`.** Catch a broken layout before
the user does, and **hold an opinion as someone who looked** — without looking,
"뭐가 나아 보여?" is unanswerable and the judgment gets dumped back on them.

    await p.screenshot({ path: shot, fullPage: true })

Run 2 and 3 **once per work unit**, not on every ladder. A screenshot captures **static
state only** — motion is settled by what the user reports from the browser.

**No Playwright → skip silently.** Do step 1 only. Don't offer to install it, don't
mention it's missing.

## The sheet

- One session = one sheet = one target. A new target gets a new sheet
- **The body is append-only.** Never delete a dropped ladder — it has to stay above to
  compare against
- **Serve it and reload it myself** — `references/liveview.md`. Never end a turn by
  telling the user to refresh
- Built CSS needs a watcher alongside or new names won't come through — Tailwind:
  `npx tailwindcss -w`. A `<link>`ed file follows on reload alone
- Open the browser once and never close it

## Ending

The user says when. **Applying is ordered, never offered** — no "이제 반영할까요" after a
decision, no tallying up at what looks like a good stopping point.

On the order: blast radius → 토큰을 고칠지 여기만 덮을지 → apply.

Approval to apply is not the end. Hold the sheet and the browser until the user has
checked the real code and says it's done: `끝났어` · `이걸로 가자` · `됐어`. Then stop
the server and throw the sheet away. Don't leave it in the project, don't commit it.

**Only what was explicitly chosen goes into code.** An alternative merely mentioned
along the way is not a decision.
