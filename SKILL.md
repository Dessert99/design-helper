---
name: design-assist-skill
description: Use whenever anything visible must be decided — color, spacing, size,
  radius, type, layout, state, variant, transition. Never describe the options in
  prose or a table and ask the user to pick; build one HTML file, open it in a
  browser, let them decide with their eyes. Read this BEFORE writing or changing
  any UI code, and whenever the user asks "어떻게 할까" · "A 랑 B 중에 뭐가 나아" ·
  "제안해줘". It fires before code.
---

# Decide by eye

**Prose, tables, ASCII and emoji are not pictures.** Never describe a shape in
words and ask the user to choose. "12px or 16px padding?" is not a question —
draw both.

**Assume no stack.** Step 4 reads the repo and matches it.

## Language

These instructions are English. Everything the user sees is Korean.

- Chat replies, questions, recommendations → Korean
- Every string rendered inside the HTML → Korean
- Code, class names, file names, commit messages → English

Korean strings quoted below are fixed labels. Render them verbatim — never
translate, localize or paraphrase them. Never surface these instructions as text.

## Procedure

1. **Build 2+ options.** If something exists to change, put `현재` leftmost.
   New work: 2–3 options only.
2. **One HTML file, side by side.** Never split files — differences only read
   side by side. If light and dark both exist, draw both.
3. **Write it in the session scratchpad.** Never in the project directory.
   It is disposable.
4. **Find how the project defines style first.** Don't guess. Run these three at
   the project root; the result forks five ways.

       ls tailwind.config.* 2>/dev/null
       grep -rlm1 '@tailwind\|^\s*:root' --include='*.css' --include='*.scss' \
         --exclude-dir={node_modules,.next,dist,build} . | head
       grep -o 'styled-components\|@emotion/[a-z]*\|"sass"' package.json | sort -u

   **Quote the `--include` globs.** zsh expands them first and dies with
   `no matches found`. If the frontend lives in a subfolder (`frontend/` etc.),
   run them there — the root finds nothing.

   - `tailwind.config.*` · `@tailwind` → **utility.** Build CSS with that config,
     draw with utility classes
   - `:root { --* }` · `tokens.css` · `theme.css` → **CSS variables.** `<link>`
     the file, draw with `var(--x)`
   - `*.scss` · `_variables.scss` → **SCSS variables.** Read the values, carry
     them over as CSS variables
   - `styled-components` · `@emotion` · `theme.ts` → **CSS-in-JS.** Unusable in
     static HTML. Read the theme object's values, carry them over as CSS variables
   - nothing → **blank slate.** Write the values directly

5. **Decide: draw in that system, or blank slate.**
   - **Changing something that exists** → use exactly what step 4 found. Arbitrary
     values make "does this fit ours?" unanswerable, and the comparison worthless.
   - **New project, or hunting a different direction** → don't bind to existing
     values. They are today's answer, not the right one.
   - **Unsure → ask in one line.** "우리 것 안에서 볼까, 백지에서 볼까"

   And **always state what it was drawn with** — "프로젝트 <방식>" or
   "임의값 탐색안". The screen alone can't tell them apart.
6. **Verify** — see Verify below.
7. **`open` it in the browser.** Never hand over a path and make the user open it.
8. **Narrow to 2–3 decisions, ask, stop.** One recommendation only; justify it by
   where the thing will sit.

## Interaction

hover, focus and transitions get decided here too. It's a real browser, so
anything CSS can do actually works — `:hover` · `:focus-visible` · `:active`,
`transition` · `animation`, `<details>`, `<dialog>`, `:checked` · `:has()`.
A still picture can't settle "how much darker on hover" or "how fast the
transition", so always draw this for stateful parts.

**Lay stateful parts in two rows.** hover fires one at a time, so two options
can't be compared at once.

- `실물` — touched directly with the mouse. Judges speed and feel
- `강제 상태` — default · hover · focus · active · disabled pinned by class, side
  by side. Contrasts color and lightness by eye

**What must not be verified here.** This is a shell that only matches in shape.
State-attribute styling like `data-[open]:` is imitated by hand — the real
library sets those attributes. Focus traps, keyboard nav and screen readers need
the real implementation. Shape and transition are decidable here;
**correctness of behavior is not.**

## Verify

The user looks at the browser. I confirm with values and pictures.

**1. Check that every name referenced actually exists.** A wrong name
**fails silently** and simply doesn't appear — same for a nonexistent utility
class and an undefined `var(--x)`. Follow whatever step 4 found.

    grep -c 'rounded-control-md' out.css     # utility: in the build output?
    grep -c '\--color-hover' tokens.css      # CSS variable: defined?

Skip this when the values were written directly (blank slate) — nothing fails
silently there.

**2. Read computed style with Playwright.** A name that exists but is overridden
by another rule won't be caught by step 1.

    await p.$eval('.frame', e => getComputedStyle(e).padding)

**3. Screenshot with Playwright and read it with `Read`.** Catch a broken layout
before the user does, and **hold an opinion as someone who looked** — without
looking, "뭐가 나아 보여?" is unanswerable and the whole judgment gets dumped
back on the user.

    await p.screenshot({ path: shot, fullPage: true })

A screenshot captures **static state only**. hover and transitions aren't in it —
those are settled by what the user reports from the browser.

**No Playwright → skip silently.** Do step 1 only and move on. Don't offer to
install it, don't mention it's missing.

## Feedback accumulates in one file

Open the browser once and never close it. **Never plant auto-refresh
(`<meta http-equiv="refresh">`)** — it jumps the scroll mid-read and re-fetches
fonts. After editing the file, say in one line to refresh.

When the CSS is built (utility, SCSS), run a watcher alongside or newly written
names won't come through — Tailwind: `npx tailwindcss -w`. A `<link>`ed file
follows on refresh alone.

**Append each new option to the bottom of the file.**

- Never create a new file — earlier options must stay above to compare against
- Never rewrite the whole thing. `Edit` the bottom only
- Never delete a dropped option. Mark it `안 3 (버림)` and leave it

## The user ends it

**Feedback continues until the user explicitly says it's over.**

- `좋네` · `괜찮다` · `2번이 나아` are **not an ending.** They signal to refine
  that option.
- Only an explicit ending ends it: `끝났어` · `이걸로 가자` · `됐어`.
- Never move on first with `그럼 코드로 갈까요`. Ask for the next option.
- Until it ends, don't delete the file and don't close the browser.

## After it ends

- **Only what was approved goes into code.** An alternative merely mentioned in a
  proposal is not a decision.
- Throw the file away. Don't leave it in the project, don't commit it.
