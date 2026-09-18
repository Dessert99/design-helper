---
name: deciding-by-eye
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

## Two shapes

Route every request before anything else.

**Single** — the request already carries an axis.
> "이 버튼 그림자 블러 5가지로 보여줘"

Draw it immediately. No decision table, no clarifying question — the request is
already complete. If the axis is compound (a shadow is blur + spread + offset +
color), lay out the first axis and add one line: "다른 축도 볼까요". **Never stop to
ask before drawing.**

**Staged** — a target to build or rework, with no single axis.
> "버튼 좀 다듬자" · "황혼 배경에 어울리는 카드를 만들고 싶어"

Agree on a stage list, then work one stage at a time — `references/stages.md`.

## Procedure — staged

1. **Propose the stage list, get agreement.** The user's list wins if they gave one.
   Otherwise propose one fitted to the target and its constraint.
2. **Detect how the project defines style** — `references/stylesystems.md`. Its five
   forks decide how everything below is drawn and how blast radius is counted.
3. **Create the file in the session scratchpad.** Never in the project directory.
   Decision table pinned at the top, the first stage's specimens below it.
4. **Verify**, then **`open` it.** Never hand over a path and make them open it.
5. **Stage loop** — present specimens, read the response, update the table, move on.
6. **Every stage settled** → draw the assembled result at the bottom. Parts that each
   looked right often don't hold together; the user can send you back to a stage here.
7. **Report the combined blast radius.**
8. **Ask whether to apply it to the code.** This is the only code gate.
9. **Apply.** Settle token change vs local override here.
10. Hold the file until the user has checked the real code and says it's done.

Steps 1–7 touch no code.

Single-shape runs skip the table and the stage loop: draw, choose, blast radius,
ask, apply.

## Drawing specimens

- **Move one axis. Hold everything else fixed.** Change blur and opacity at once and
  neither can be judged. The whole tool rests on this one rule.
- **Number every specimen** — ①②③. Numbers are unique across the entire file and
  never reused; a second ladder starts at ④. `③으로 갈게` must resolve to exactly one.
- **Label each specimen with its cost**, not only its value. Cost is a property of the
  option and has to be visible while choosing:
  `토큰 그대로` · `--radius-md 고침 (23곳)` · `새 토큰`
- 5–7 specimens per ladder. Two axes → a matrix, not a row.
- Ladders, backgrounds, repetition, sizes, wireframes → `references/sweeping.md`
- Anything that moves → `references/motion.md`
- **Never recommend one value on a ladder.** Point at perceptual boundaries instead:
  "⑥과 ⑦은 이 크기에서 구분이 안 됩니다" · "⑤부터 떠 보이기 시작합니다". One
  recommendation is fine for composed variants (the 0th stage of a staged run).

## Reading the response

Three kinds. Never collapse them.

| response | kind | do |
|---|---|---|
| `좋네` · `③이 낫네` | impression | Not a choice. Ask whether to refine it |
| `③이 나은데 더 진하게` | refine | Append a new ladder below, numbering continues |
| `③으로 갈게` · `이걸로 고를게` | **choice** | Update the table, present the next stage |

`③이 낫네` is a remark made mid-comparison, not a decision. **Touch no code until the
user says they are choosing it.**

Ambiguous — `"이거 좋다"` with nine specimens on screen — ask which one. Never guess.

## Decision table

Pinned at the top of the file, sticky so it stays readable while scrolling a ladder.
It holds the stage list and what each stage settled on.

Revising an earlier stage overwrites that row and notes `(⑧에서 변경)`. The old
specimens stay where they are.

**The stage list changes mid-run.** A stage turns out unnecessary, or stage 1 reveals
one that was missing. Add and drop rows as that happens — don't hold to the list
agreed at the start.

## Blast radius — twice, differently

- **While choosing** — the one-line cost label on each specimen. A label, not a report
- **Before applying** — the real one. Files, lines, tokens, and everything else that
  moves with them. Stages interact and earlier ones get revised, so only this final
  tally is accurate

If the project animates with a motion library, say what won't translate —
`references/motion.md`.

## Verify

The user looks at the browser. I confirm with values and pictures.

**1. Every name referenced must exist.** A wrong name **fails silently** — it simply
doesn't appear. Same for a nonexistent utility class and an undefined `var(--x)`.
Check per the fork found in step 2. Run this **every time specimens are added.**

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

Run 2 and 3 **once per stage**, not on every ladder. A screenshot captures **static
state only** — motion is settled by what the user reports from the browser.

**No Playwright → skip silently.** Do step 1 only. Don't offer to install it, don't
mention it's missing.

## The file

- One session = one file = one target. A new target gets a new file
- **The body is append-only. Only the decision table is rewritten**
- Never delete a dropped ladder — it has to stay above to compare against
- **Never plant auto-refresh (`<meta http-equiv="refresh">`)** — it jumps the scroll
  mid-read and re-fetches fonts. After editing, say in one line to refresh
- Built CSS needs a watcher alongside or new names won't come through — Tailwind:
  `npx tailwindcss -w`. A `<link>`ed file follows on refresh alone
- Open the browser once and never close it

## Ending

Two layers.

- **A stage ends** on an explicit choice → update the table, present the next stage.
  **Never let the user drive the sequence** — ask for the next stage yourself.
- **The session ends** when every stage is settled: assembled result → combined blast
  radius → "코드에 반영할까요?" → apply on approval.

Approval to apply is not the end. Hold the file and the browser until the user has
checked the real code and says it's done: `끝났어` · `이걸로 가자` · `됐어`.

Then throw the file away. Don't leave it in the project, don't commit it.

**Only what was explicitly chosen goes into code.** An alternative merely mentioned
along the way is not a decision.
