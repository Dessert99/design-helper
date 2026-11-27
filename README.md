# design-helper

[![last commit](https://img.shields.io/github/last-commit/Dessert99/design-helper)](https://github.com/Dessert99/design-helper/commits/main)
[![release](https://img.shields.io/github/v/release/Dessert99/design-helper)](https://github.com/Dessert99/design-helper/releases)

[English](README.md) | [한국어](README.ko.md)

> A Claude Code and Codex plugin of six skills that let you settle design decisions one at a time, each drawn on your real screens before you pick.

> [!NOTE]
> Replies and every string on the comparison sheet are in **Korean**. See [Language](#language) to change that.

**1. "Show me five options": Compare them while your project code stays untouched.**

![Comparison sheet: the card's shadow blur in five versions, A–E](assets/launch-before.png)

**2. "Go with C": Apply the chosen value to the code.**

![After picking C: the card with blur 12px and the tokens.css diff](assets/launch-after.png)

## Six skills

One plugin holds six skills, and they all work the same way: one decision is drawn as a
few candidates on your real screens, side by side with the differences named, and you
pick by eye. None of them hands you a finished design in one go the way a generative
design tool does.

| Skill | Decides | Runs | Leaves |
|---|---|---|---|
| `design-helper` | one value (spacing, radius, shadow, color, a CSS transition's duration or easing) or one layout | on its own when you ask | a code change |
| `design-system` | a design system, item by item from a checklist (type, spacing, color, shape and more) | when called by name | the decision record |
| `design-sync` | bringing the code in line with the settled values of the record | when called by name | a code change, an agent block |
| `design-ux` | one feature's flow, screen layout, interactions, states and wording | when called by name | the decision record |
| `design-brand` | an icon set and a logo direction | when called by name | the decision record, logo files |
| `design-motion` | a moment where several elements move (GSAP, Motion, scroll-linked) | when called by name | the decision record (a motion spec) |

Each skill works alone; none needs another first. Decisions collect in the project's
`design-decisions/` (or under a Notion page you give), and every skill draws its next
candidates on top of what is already settled. From "Why" to "Usage" below is about
`design-helper`, the one that runs on its own; the other five are under
[Skills you call by name](#skills-you-call-by-name).

## Why

Ask an agent to "show me five options" and it may edit your product code before you
have chosen one. Then you have to undo changes just to keep comparing. Judging CSS
values from numbers alone also leads to repeated edits and reloads.

design-helper **separates seeing options from applying one**. It creates comparison
files outside your project and puts the candidates side by side in your browser. Your
project code changes after you pick an option.

Use it to compare borders, spacing, shadows or layouts in an existing UI before you
commit to a change.

## What it does

A typical round:

```
you   Show me the card's shadow blur in 5 versions

      → reads the project's style system and the card's current values
      → draws cards A–E with only the blur changed: 4 · 8 · 12 · 16 · 24px
        (color, opacity, offset and the rest stay as they are)
      → labels each specimen with its value and cost:
        토큰 그대로 · --shadow-md 고침 (23곳) · 새 토큰
        (token as-is · edits --shadow-md in 23 places · new token)
      → under the cards, notes where the differences stop showing and which
        one it recommends, and why
      → leaves project code untouched so far

you   Show me a little more blur around C

      → adds a blur ladder below, starting from C (F · G · H …)

you   Go with G

      → checks what else it touches, applies it to the real card, verifies
        the result, and reports back

you   Done

      → stops the server and deletes the temporary files
```

Only one property changes at a time and everything else stays put, so any difference
you see comes from that property. Each value you pick carries into the next comparison.

- **Your code stays untouched while you compare.** The sheet, server, notes and
  screenshots live in a temporary folder outside your project. Ask for more options
  and the comparison continues there.
- **Your pick is the apply command.** Say "Go with G" and the skill checks the impact
  before editing the code. You don't need to copy values yourself.
- **The sheet explains itself.** Each section starts with what to decide, where to look
  and how to answer. Each specimen shows its value and cost, plus what it gains and
  loses when that matters. A table of contents on the left lists every request, so you
  can jump back to an earlier comparison.
- **You don't refresh.** When the sheet changes, the skill reloads the tab and brings it
  to the front. If the agent can't control a browser, it says so and gives you the URL.
- **Your conversation stays light.** A subagent reads the code, draws the sheet and
  checks it. The main conversation passes messages and applies your pick, so a long
  comparison doesn't crowd out the rest of your work. In a test run the main agent grew
  by about 5k tokens over four rounds. Where subagents aren't available, the main agent
  does the work itself.
- **It draws in your style system.** Tailwind and CSS variables are drawn with your real
  classes and tokens. The browser can't read SCSS variables or CSS-in-JS themes, so their
  values are copied into the sheet as CSS variables. With no style system, it writes
  values directly.

The worker reuses loaded guidance and reads only the affected source and sheet section
on later rounds. Captions mark the current project value when it is a candidate. Sheet
classes and variables use a `dh-` prefix to reduce collisions with product styles.

With Playwright available, every changed specimen gets a computed-style check. Screenshots
are taken for the first ladder and layout changes; value-only revisions use `--no-shot`.
Missing targets, invalid properties, expected-count mismatches, resource errors and clipped
frames fail the check. First-screen counts cover the primary context at the specified
viewport. `NO_PLAYWRIGHT` means unverified. The reloader detects HTML and CSS content changes,
including same-length edits within one second and delayed CSS builds.

A recorded choice becomes the code baseline only after the main agent reports a successful
apply. Cleanup removes project artifacts only with evidence that this session created them.

## What it doesn't do

- **It doesn't make up a design.** It shows a range of values to compare, not a finished
  look. It recommends one option and says why, and notes what each option gives up,
  but you make the pick.
- **It doesn't plan your next step.** No "let's look at color next" and no list of
  remaining steps. You decide what to look at next.
- **It can't check behavior.** Focus traps, keyboard handling and screen readers can't
  be judged by eye, so design-helper leaves them out. A feature's flow and whether the
  keyboard alone can finish it are measured by `design-ux`, which performs the task in
  each prototype.
- **You judge CSS motion.** Screenshots only capture a still frame, so design-helper's
  motion comparisons are settled by what you see in the browser and tell it. Motion run by
  GSAP or Motion is measured by `design-motion`, which seeks the real library to each
  moment.
- **It doesn't automatically check that code stayed untouched before your pick.** Its
  instructions keep comparison files outside the project, but there is no `git diff`
  check for unexpected product code changes yet.

## Requirements

- [Claude Code](https://claude.com/claude-code) or Codex
- A browser
- `python3` to run the local server that serves and auto-reloads the sheet. Without it
  the sheet opens over `file://`, with no auto-reload and no automatic cleanup of the
  temporary folder after 30 idle minutes.
- Playwright (optional) to read computed styles and take screenshots. Without it that
  check is skipped. `design-ux`'s step strips, `design-brand`'s 16px measurements and
  `design-motion`'s frame strips and measurements also run on Playwright, so those three
  need it to work fully.
- Internet access (sometimes): icon sets, GSAP, Motion and typefaces the project doesn't
  have installed are fetched into the workspace with `npm pack`.

## Install

### As a plugin (recommended)

This repository is a plugin marketplace for both agents.

```sh
# Claude Code: inside a session
/plugin marketplace add Dessert99/design-helper
/plugin install design-helper@design-helper

# Codex: from the shell
codex plugin marketplace add Dessert99/design-helper
codex plugin add design-helper@design-helper
```

Start a new session afterwards so the skills load; all six appear under `design-helper:`.
To update, refresh the marketplace
(`/plugin marketplace update design-helper` in Claude Code,
`codex plugin marketplace upgrade` in Codex) and install again.

### From a clone

Use this if you want to edit the skills, for example to [change their language](#language).
Register the clone as a marketplace and you can edit it while using it as a plugin.

```sh
git clone https://github.com/Dessert99/design-helper.git ~/src/design-helper

# Claude Code: from the shell (inside a session: /plugin marketplace add ~/src/design-helper)
claude plugin marketplace add ~/src/design-helper
claude plugin install design-helper@design-helper

# Codex
codex plugin marketplace add ~/src/design-helper
codex plugin add design-helper@design-helper
```

- **Claude Code** reads a plugin installed this way straight from the clone. Edits apply
  from the next session or after `/reload-plugins`.
- **Codex** copies the plugin on install. Run `codex plugin add design-helper@design-helper`
  again after editing.

#### With symlinks

You can instead link each skill folder. The symlink points at the clone, so your edits take
effect right away and there's no copy to keep in sync. Don't mix this with the plugin
install, or each skill is registered twice. Commands then have no `design-helper:` prefix
(`/design-brand`).

```sh
for s in design-helper design-system design-ux design-brand design-motion design-sync; do
  ln -sfn ~/src/design-helper/skills/$s ~/.claude/skills/$s   # Claude Code
  ln -sfn ~/src/design-helper/skills/$s ~/.codex/skills/$s    # Codex
done
```

Both agents read the `description` in `SKILL.md` when a session starts, and the rest
(`SKILL.md`, `worker.md`, `references/`, and the plugin's `shared/` folder) when the skill runs. Edits to the body apply
immediately; a changed `description` needs a new session.

A symlinked skill has no plugin agent, so Claude Code hands the work to a general-purpose
subagent that reads `worker.md` instead. It works the same way. Link the skill folder
inside the clone, not a copy of it: the skill finds `shared/` by following the link back
to the clone.

To remove it, delete the symlinks (`rm ~/.claude/skills/design-*`). The clone stays.

## Usage

Talk as you normally would while building or changing UI. Requests like these trigger it:

"Show me," "compare," and "C is better, but darker" keep you in comparison mode.
Project code stays untouched until you choose a specimen.

- "Show me 5 versions of the button radius"
- "Which is better, A or B?"
- "Compare the card padding"
- "This header feels off, what should I do?" If it isn't clear what to change, it asks
  one question at a time.
- "Lay out the dashboard." With no design yet, it starts with a few very different
  combinations. The one you pick isn't written to code; it's noted as a starting point,
  and properties are then settled one at a time.

Specimens in the browser are lettered A · B · C. You answer in chat.

| You say | It does |
|---|---|
| "Go with C" · "I like B" | Takes it as your pick, applies it to the code and checks it. A combination picked on a blank slate is only noted as a starting point |
| "C is better, but darker" | Takes it as a request to compare more and adds a ladder below |
| "Nice" | Asks which specimen you mean |
| "Done" | Stops the server and cleans up the temporary files |

### Skills you call by name

Five more skills run only when you call them by name, never on their own. Each works alone;
none needs another first. They write no code and leave only the decision record, except
`design-sync`, which moves the record into the code.

| Command | What it does |
|---|---|
| `/design-helper:design-system` (Codex: `$design-system`) | Walks a checklist (purpose, type, spacing, color, shape, then optional layout, motion, components). Each item is drawn on a board of your real screens and you pick by eye. Values can come from your code, from public systems (Tailwind defaults, Radix Colors, Open Props, Material 3, shadcn/ui) or from scratch; all are candidates until picked. Contrast and target sizes are measured and shown on the specimens. Picks go to `design-decisions/` in the project, or under a Notion page you give it. It writes no code |
| `/design-helper:design-ux` (Codex: `$design-ux`) | Decides how one feature works, in a UX designer's order: goal and task, then flow, screen layout, interactions, states and wording. Each candidate is a working prototype on your real design; under it, a strip of screenshots taken while actually performing the task, with clicks, screen changes, whether the list keeps its place and whether the keyboard alone can finish. Picks go to `design-decisions/ux-<task>.md`. One feature at a time, not a whole app's structure. It writes no code |
| `/design-helper:design-brand` (Codex: `$design-brand`) | Picks an icon set and a logo direction where they are really used: the header, a 360px mobile header, the 16px browser tab (also enlarged pixel by pixel), an app icon, buttons, table actions and empty states. Icon sets (Lucide, Phosphor, Tabler, Heroicons, Material Symbols) are compared on the concepts your product uses, with missing ones counted. Logos are drawn as SVG, one decision at a time (form, typeface, symbol direction, details, the small version), with blur and the thinnest strokes measured at 16px. It never draws after an existing brand, and marks every logo candidate as not trademark-searched. Picks go to `design-decisions/icons.md` and `logo.md`, the chosen files to `design-decisions/assets/brand/`. It writes no code |
| `/design-helper:design-motion` (Codex: `$design-motion`) | Decides how one moment moves (a page entering, a list appearing, a panel opening, a scroll section) in a motion designer's order: purpose, choreography, easing or spring, timing, trigger and interruption, reduced motion. Candidates play with your real library (GSAP or Motion) on your real design, all on one clock at 1x, 0.5x or 0.25x with a scrubber; a scroll-linked moment (ScrollTrigger) plays the same scroll path in every candidate (down, up, down again) and measures whether elements move where they can be seen and whether they rewind when you scroll back up, each with a frame strip and a progress graph measured from the library itself: length, settling time, overshoot, whether layout moves, travel when reduced. Picks go to `design-decisions/motion-<moment>.md` as a spec table. A single CSS transition value stays with design-helper. It writes no code |
| `/design-helper:design-sync` (Codex: `$design-sync`) | Brings the code in line with the record: shows each changed token before and after on your real screens with its blast radius, applies the scope you pick, then adds a short block to `AGENTS.md` and `CLAUDE.md` so later agent sessions use the settled values (it asks before adding it the first time) |

Deciding or changing a value always goes through a sheet: a value you only state in words
is drawn before it counts as settled.

## Compared with similar skills

Checked in September 2026 against the commits linked below. Most of these skills help
you decide **what to make**; design-helper helps you decide **what value a thing you've
already decided on should have**. They work well together.

**[frontend-design](https://github.com/anthropics/skills/tree/33375500bcea98d610eb30ce10ac4e59b89c390d/skills/frontend-design)** (Anthropic, official)
- What it does: has the agent think like a design lead and pick bold, deliberate styling over the usual AI look.
- Difference: it doesn't draw candidates to compare; the agent sets the taste. design-helper draws candidates and recommends one, and you pick.
- Use it when: you want a polished first design from a blank page in one go. design-helper won't come up with a direction for you.

**[playground](https://github.com/anthropics/claude-plugins-official/tree/aecd4c852f10b466245f18383fa6aad8c0b10d57/plugins/playground)** (Anthropic, official plugin)
- What it does: builds a single HTML file with controls on one side and a live preview on the other, and you copy the result out as a prompt to paste back into Claude. Besides design, it has templates for data, code structure, and document review.
- Difference: one preview carries sliders for several properties, so you see one state at a time. design-helper fixes candidates that change one property and puts them side by side, then applies your pick to the code and checks it instead of handing back a prompt.
- Use it when: you want to get a feel for a combination by playing with it, with no single right answer, or you need an explorer for something that isn't design.

**[impeccable](https://github.com/pbakaus/impeccable/tree/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8)** (pbakaus)
- What it does: a design vocabulary, anti-pattern rules, and commands like `audit` · `polish` · `typeset` · `layout`. In live mode you pick an element in the running app, flip through variants in the browser, and the one you accept is written to source. It reads your CSS tokens and computed styles, and variants can have tuning sliders.
- Difference: the closest match. Its variants rebuild the whole element, so several properties change at once, and you see them one at a time. design-helper puts a ladder that changes one property on one screen, side by side, and labels each specimen with its token impact.
- Use it when: you want to pick directly in the real app, or run a design audit and polish with one command.

**[visual companion](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/brainstorming/visual-companion.md)** (part of the brainstorming skill in obra/superpowers)
- What it does: while you brainstorm before building, it shows mockups, diagrams and side-by-side comparisons in the browser, and you click to pick. It also helps with spacing and visual hierarchy.
- Difference: it doesn't make one-property ladders, applying the pick to code, or checking it afterwards part of the process. In design-helper those are the default.
- Use it when: you need visuals that aren't UI, like architecture diagrams, or you're setting direction before building.

**[design-shotgun](https://github.com/garrytan/gstack/blob/2a113ae7e623f590095bcaaa0cc581c9a10a6632/design-shotgun/SKILL.md.tmpl)** (garrytan/gstack)
- What it does: generates 3–8 different mockups as images, shows them on a comparison board, collects ratings and notes, and generates again. It remembers the taste you approved.
- Difference: the output is images (PNG), not code, so another skill has to apply it, and it needs an image-generation tool. design-helper draws in CSS with no extra tools.
- Use it when: you don't know yet what you want and want to see many directions.

**What design-helper does differently**: it keeps comparison files outside the project until you choose. It shows one-property ladders side by side with impact labels and a recommendation, then applies and checks your pick.

**Where design-helper falls short**: it doesn't propose a finished design direction, doesn't detect anti-patterns, compares on a separate sheet rather than in the live app, and replies only in Korean by default.

## Language

The instructions are in English, but chat replies and everything on the comparison
sheet are in Korean. Code, class names, file names and commit messages stay in English.

To change it, install [from a clone](#from-a-clone) and edit the `## Language` section in
`shared/core.md`. A plugin installed straight from GitHub is replaced on every update, so
edits there don't last. The Korean phrases quoted in the instructions (`토큰 그대로`, `끝났어`
and so on) need to change too.

## Docs

- [`skills/design-helper/`](skills/design-helper/): the comparison skill
  - [`SKILL.md`](skills/design-helper/SKILL.md): what the main agent reads first: why the skill exists, where the plugin root is, and which worker instructions to run
  - [`worker.md`](skills/design-helper/worker.md): this skill's own rules. The work unit, drawing rules, reading replies, the record, blast radius, finishing
  - [`references/sweeping.md`](skills/design-helper/references/sweeping.md): candidate values, captions and the recommendation, background and size, starting from a blank slate, layouts in the real design (gray skeleton only on request)
  - [`references/motion.md`](skills/design-helper/references/motion.md): comparing animation
- [`skills/design-system/`](skills/design-system/): building the design decision record from a checklist; [`references/checklist.md`](skills/design-system/references/checklist.md) holds the default items, roles, intents and checks, [`references/imports.md`](skills/design-system/references/imports.md) the public systems values may come from
- [`skills/design-ux/`](skills/design-ux/): deciding how one feature works; [`references/patterns.md`](skills/design-ux/references/patterns.md) lists the patterns candidates come from, [`references/evaluate.md`](skills/design-ux/references/evaluate.md) the walkthrough, the ten heuristics and the state list
- [`skills/design-brand/`](skills/design-brand/): picking an icon set and a logo direction; [`references/icons.md`](skills/design-brand/references/icons.md) lists the public sets, [`references/logo.md`](skills/design-brand/references/logo.md) the forms, typefaces, symbol directions and the rules against resembling other brands
- [`skills/design-motion/`](skills/design-motion/): deciding how one moment moves; [`references/choreography.md`](skills/design-motion/references/choreography.md) lists the choreography, easing and timing options, [`references/libraries.md`](skills/design-motion/references/libraries.md) how GSAP and Motion are loaded and connected
- [`skills/design-sync/`](skills/design-sync/): bringing the code in line with the record
- [`shared/`](shared/): what every skill in the plugin uses
  - [`decisions.md`](shared/decisions.md): the decision record: structure, statuses, rules, and the `기록 지시:` handoff
  - [`board.md`](shared/board.md): the board of real screens every skill draws candidates on, one frozen page per section
  - [`agent-guide.md`](shared/agent-guide.md): the block that makes later agents follow the record, and the check before delivering
  - [`main.md`](shared/main.md): how the main agent runs a skill. It hands the work to a subagent and passes messages between it and you, so the main conversation stays small. Without subagents, the main agent does the work itself
  - [`core.md`](shared/core.md): rules every worker reads first. The decision loop and its principles, talking through the main agent, language, findings, verification, the sheet
  - [`clarification.md`](shared/clarification.md): asking about a vague request
  - [`writing.md`](shared/writing.md): how every Korean sentence the user reads is written: short sentences, no symbol shorthand, attached particles, the caption layout
  - [`sheet.md`](shared/sheet.md): the sheet page's request dividers, table of contents, layout and style
  - [`stylesystems.md`](shared/stylesystems.md): detecting the style system and drawing in each one
  - [`controls.md`](shared/controls.md): optional sliders: when to add one and the rules it has to follow
  - [`liveview.md`](shared/liveview.md): the temporary folder, local server, browser tabs, cleanup
  - [`assets/`](shared/assets/): fixed files the worker copies instead of writing them each time
    - [`sheet.html`](shared/assets/sheet.html): the empty comparison sheet with its style, table of contents and auto-reload
    - [`serve.py`](shared/assets/serve.py): the local server that cleans itself up after 30 idle minutes once your browser has opened the sheet
    - [`check.cjs`](shared/assets/check.cjs): reads computed styles and takes a screenshot with Playwright in one run
    - [`walk.cjs`](shared/assets/walk.cjs): performs a task in a prototype and records the step strip, clicks, screen changes and a keyboard-only run
    - [`icons.cjs`](shared/assets/icons.cjs): gathers public icon sets per concept and reports missing icons, stroke and license
    - [`pixel.cjs`](shared/assets/pixel.cjs): renders a logo at its real sizes, enlarges the small ones, measures blur and the thinnest parts, turns text into outlines and exports PNGs
    - [`motion.js`](shared/assets/motion.js): the play bar that runs a section's motion specimens on one clock, and the connector a specimen uses for GSAP or Motion; a scroll-linked specimen uses a fixed scroll path as its clock
    - [`motion.cjs`](shared/assets/motion.cjs): seeks a specimen's real animation to fixed times for the frame strip, the progress graph and the measurements
- [`agents/worker.md`](agents/worker.md): the Claude Code plugin agent every skill spawns. It reads `shared/core.md` and the skill's `worker.md`. Codex plugins can't ship agents, so Codex spawns a plain subagent instead
- [`scripts/bump-version.sh`](scripts/bump-version.sh): sets the version in every plugin manifest, then commits and tags the release

Kit regression checks run without installing a browser. They test HTTP responses,
reload decisions and checker reports; they do not prove rendered fidelity.

```sh
python3 scripts/test-kit.py
node scripts/test-reloader.cjs
node scripts/test-check.cjs
python3 scripts/test-skills.py   # frontmatter, invocation guards, paths named in instructions
```

The decision record's structure and the agent block are adapted from how
[Astryx](https://github.com/meta/astryx) (MIT) keeps design intent for agents. design-ux's
steps draw on the Double Diamond and Nielsen Norman Group's task analysis, walkthroughs and
ten heuristics; design-motion's library rules on GreenSock's
[gsap-skills](https://github.com/greensock/gsap-skills) (MIT). Only the approach is
borrowed; no text or values are copied.

## License

[MIT](LICENSE)
