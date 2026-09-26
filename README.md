# design-helper

[![last commit](https://img.shields.io/github/last-commit/Dessert99/design-helper)](https://github.com/Dessert99/design-helper/commits/main)
[![release](https://img.shields.io/github/v/release/Dessert99/design-helper)](https://github.com/Dessert99/design-helper/releases)

[English](README.md) | [한국어](README.ko.md)

> A Claude Code skill for settling CSS values, layout and motion by eye instead of in prose.

> [!NOTE]
> Replies and every string on the comparison sheet are in **Korean**. See [Language](#language) to change that.

<!-- screenshot of a specimen sheet goes here -->

## Why

"12px or 16px padding?" in a chat window is not an answerable question. Nobody can
picture a shape from a number, so however well the options are described, you end up
putting one in the code, reloading, and trying again.

design-helper doesn't ask in words. It draws every candidate, lays them side by side in
your browser, and you pick the one you like with your eyes.

- e.g. You want to quickly see how this component looks with different borders.
- e.g. You want to settle the base layout of this page.

## What it does

One cycle goes like this.

```
you   Show me the card's shadow blur in 5 versions

      → reads the project's style system and the card's current values
      → draws cards A–E with only the blur changed: 4 · 8 · 12 · 16 · 24px
        (color, opacity, offset and everything else held fixed)
      → labels each specimen with its value and cost:
        토큰 그대로 · --shadow-md 고침 (23곳) · 새 토큰
        (token as-is · edits --shadow-md in 23 places · new token)

you   C is better, but a bit darker

      → appends an opacity ladder below, based on C (F · G · H …)

you   Go with G

      → checks what else it touches → applies it to the real card → verifies with
        computed style and a screenshot → reports

you   Done

      → stops the server and deletes the temporary files
```

The rule is **one order, one axis, one decision**. Only one property moves at a time
and everything else is held fixed, so any difference you see is that property. Every
value you pick becomes the base for the next comparison.

- **You never copy a value.** Say a letter in chat and the skill writes the code change.
- **You never refresh.** When the sheet changes, the skill reloads its tab and brings it to the front.
  If the agent has no browser controls, it tells you so and gives you the sheet URL.
- **Your project stays clean.** The sheet, server, notes and screenshots all live in a
  temporary folder outside the project. The only thing left in the project is the code
  for the values you chose; the sheet is thrown away.
- **It draws in your style system.** Tailwind and CSS variables are drawn with your real
  classes and tokens. SCSS variables and CSS-in-JS themes can't be read by the browser,
  so their values are read and carried into the sheet as CSS variables. With no style
  system, it writes values directly.

## What it doesn't do

- **It doesn't invent a design.** It's a ruler that lays out a range; the taste is yours.
  It won't recommend one value on a ladder either. It points out visible boundaries —
  "B and C look the same at this size" — and recommends only when you ask outright.
- **It doesn't plan the work for you.** No "let's look at color next", no list of remaining
  steps. What to look at next is always your call.
- **It can't verify behavior.** Focus traps, keyboard handling and screen readers aren't
  decided by eye, so they're out of scope.
- **Motion rests on your eyes.** Screenshots only capture static state, so animation is
  settled by what you report from the browser.

## Requirements

- [Claude Code](https://claude.com/claude-code) or Codex
- A browser
- `python3` — runs the local server that serves the sheet and reloads it automatically.
  Without it the sheet opens over `file://`: no auto-reload, and no automatic cleanup of
  the temporary folder after two idle minutes.
- Playwright (optional) — used to verify computed style and take screenshots. Without
  it that verification step is skipped.

## Install

### As a plugin (recommended)

The repository is its own plugin marketplace for both agents.

```sh
# Claude Code — inside a session
/plugin marketplace add Dessert99/design-helper
/plugin install design-helper@design-helper

# Codex — from the shell
codex plugin marketplace add Dessert99/design-helper
codex plugin add design-helper@design-helper
```

Start a new session afterwards so the skill is picked up. To update, refresh the
marketplace (`/plugin marketplace update design-helper` in Claude Code,
`codex plugin marketplace upgrade` in Codex) and reinstall.

### From a clone

Use this if you want to edit the skill — for example to [change its language](#language).
Clone it anywhere, then symlink the skill folder into the skills directory of whichever
agent you use. A symlink is a pointer, not a copy — edits to the clone take effect
immediately, and there is no second copy to keep in sync.

```sh
git clone https://github.com/Dessert99/design-helper.git ~/src/design-helper

ln -sfn ~/src/design-helper/skills/design-helper ~/.claude/skills/design-helper   # Claude Code
ln -sfn ~/src/design-helper/skills/design-helper ~/.codex/skills/design-helper    # Codex
```

Both agents load it the same way. The `description` in `SKILL.md` is read at session
start; the body and everything under `references/` are read when the skill fires. So
edits to the body apply right away, while a changed `description` needs a new session.

To remove it, delete the symlink — `rm ~/.claude/skills/design-helper`. The clone is
untouched.

## Usage

Talk as you normally would while building or changing UI. Requests like these trigger it:

- "Show me 5 versions of the button radius"
- "Which is better, A or B?"
- "Compare the card padding"
- "This header feels off, what should I do?" — if what to change isn't clear yet, it asks one question at a time
- "Lay out the dashboard" — with no design at all, it opens with broadly different combinations.
  The one you pick isn't applied to code; it's recorded as a starting point, and properties are settled one at a time from there

Specimens in the browser carry letters A · B · C. You answer in chat.

| You say | It does |
|---|---|
| "Go with C" · "I like B" | A choice. Applies it to the code and verifies right away (a blank-slate combination is only recorded as a starting point) |
| "C is better, but darker" | More comparison. Appends a ladder below |
| "Nice" | Asks which specimen you mean |
| "Done" | Stops the server and cleans up the temporary files |

Example conversations for each situation are in the [usage flows](docs/flows.ko.md)
(Korean only): unhappy but unsure what to change, comparing states (hover · focus),
comparing animation, changing a value you already settled, and 11 situations in all.

## Compared with similar skills

Surveyed September 2026, against the commits linked below. Most other skills help decide
**what to make**; design-helper helps decide **what value something already decided should
take**. So it sits beside them more than against them.

**[frontend-design](https://github.com/anthropics/skills/tree/33375500bcea98d610eb30ce10ac4e59b89c390d/skills/frontend-design)** (Anthropic, official)
- What it does: gives the agent a design lead's perspective and pushes it toward bold, intentional aesthetics instead of generic AI styling.
- Difference: there's no step that draws candidates to compare; the agent decides the taste. design-helper decides no taste and has you pick by eye.
- Reach for it when: you want a finished-looking first design from a blank page in one go. design-helper won't invent a direction.

**[impeccable](https://github.com/pbakaus/impeccable/tree/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8)** (pbakaus)
- What it does: a design vocabulary, anti-pattern detection rules, and commands such as `audit` · `polish` · `typeset` · `layout`. Its live mode lets you pick an element in the running app, flip through variants in the browser, and writes the accepted one to source. It reads existing CSS tokens and computed styles, and variants can carry tuning sliders.
- Difference: the closest skill. Its variants rebuild the whole element, so several properties change together, and you view them one at a time. design-helper puts a ladder that moves a single property on one screen, side by side, with each specimen labeled by its token impact.
- Reach for it when: you want to pick right on the real app, or run a design audit and polish with one command.

**[visual companion](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/brainstorming/visual-companion.md)** (obra/superpowers, part of the brainstorming skill)
- What it does: shows mockups, diagrams and side-by-side comparisons in the browser during pre-implementation brainstorming; you pick by clicking. It's also used for polish questions like spacing and visual hierarchy.
- Difference: it doesn't prescribe single-property ladders, or applying and verifying the choice in code afterwards. In design-helper those three are the default procedure.
- Reach for it when: you need visuals beyond UI, like architecture diagrams, or you're setting direction before implementation.

**[design-shotgun](https://github.com/garrytan/gstack/blob/2a113ae7e623f590095bcaaa0cc581c9a10a6632/design-shotgun/SKILL.md.tmpl)** (garrytan/gstack)
- What it does: generates 3–8 distinct design mockups as images, shows them on a comparison board, collects ratings and notes, and iterates. It remembers approved taste.
- Difference: the output is images (PNG), not code; applying it is left to other skills. It needs an image-generation tool. design-helper draws in CSS with no generation tool.
- Reach for it when: you can't yet say what you want and need to diverge widely.

**How design-helper works differently**: single-property ladders compared side by side, an impact label on every specimen, no recommendation on a ladder, a choice carried through to application and verification, and working files kept outside the project.

**Where design-helper falls short**: it doesn't suggest a design direction, has no automatic anti-pattern detection, compares on a separate sheet rather than the live app, and replies only in Korean by default.

## Language

The instructions are written in English, but chat replies and every string rendered
on the comparison sheet are Korean. Code, class names, file names and commit messages
stay English.

To switch, install [from a clone](#from-a-clone) and edit the `## Language` section in
`skills/design-helper/SKILL.md`. (A plugin install is overwritten on every update.) The fixed Korean labels quoted
throughout the instructions (`토큰 그대로`, `끝났어`, and so on) need to change with it.

## Docs

- [`SKILL.md`](skills/design-helper/SKILL.md) — the skill itself: the work unit, drawing rules, reading replies, verification, ending
- [`references/`](skills/design-helper/references/) — detailed instructions the skill reads when needed
  - [`clarification.md`](skills/design-helper/references/clarification.md) — asking questions about a vague request
  - [`sweeping.md`](skills/design-helper/references/sweeping.md) — candidate scales, background and size context, starting from a blank slate, wireframes
  - [`stylesystems.md`](skills/design-helper/references/stylesystems.md) — detecting the style system and drawing in each one
  - [`controls.md`](skills/design-helper/references/controls.md) — optional sliders and the sheet engine
  - [`motion.md`](skills/design-helper/references/motion.md) — comparing animation
  - [`liveview.md`](skills/design-helper/references/liveview.md) — the temporary workspace, local server, browser tab handling, cleanup
- [`docs/flows.ko.md`](docs/flows.ko.md) — usage flows by situation (Korean)
- [`scripts/bump-version.sh`](scripts/bump-version.sh) — sets the version in every plugin manifest, then commits and tags the release

## License

[MIT](LICENSE)
