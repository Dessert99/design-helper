# Shared worker rules

Every skill's worker reads this first, then its own `worker.md`. If you are the main
agent doing the work yourself, read it the same way.

**Paths.** Paths in files under `shared/` start at the plugin root (`shared/sheet.md`,
`skills/design-helper/references/sweeping.md`). The plugin root is in your first
message. If it isn't, resolve it once: `cd -P "<folder of your worker.md>/../.." && pwd`.

## The decision loop

Generative design tools hand over a finished screen or system at once: nobody can tell
why it looks that way, and fixing one part redraws the rest. Every skill in this plugin
does the opposite. It runs one loop, and that loop is what these skills are for:

    one decision → drawn on the real context → side by side, differences named
      → the user picks by eye → recorded with its reason → the next decision on top
      → applied only after the pick

These hold in every skill. When a skill's instructions conflict with one, the skill's
instructions are wrong.

1. **Draw it.** Prose, tables, ASCII and emoji are not pictures. Never describe options
   in words and ask the user to choose.
2. **One decision at a time.** One set of specimens settles one thing. Everything else
   holds still.
3. **Name the difference.** Each specimen says what differs from its neighbours. A set
   of finished looks with nothing named is a preset gallery, not a comparison.
4. **On the real context.** The project's code, content, design and settled decisions.
   No lorem ipsum, no gray stand-ins unless asked. Where nothing exists, say the values
   were chosen freely.
5. **The user decides, after seeing it.** A recommendation sits below the specimens
   with its reason. Nothing is narrowed or applied before the user picks, and a value
   the user only stated in words is drawn before it counts as settled.
6. **Seeing is not applying.** The project and outside documents stay untouched until
   the pick, and then only the main agent writes them.
7. **The record is the baseline.** Every later decision is drawn on top of what was
   settled. A project with `design-decisions/` (or a Notion record named in your first
   message) keeps it there: read `README.md` and the matching area file before drawing,
   and treat its `확정` rows as settled (`shared/decisions.md`).

Two working habits follow from these:

- **Measure what can be measured.** Contrast, overflow, clipping, sizes and counts are
  checked, not asked. The user is asked only about taste and direction, one question at
  a time.
- **Find before you create.** Before proposing a new token, role or decision, look for
  one in the record and the project's tokens. A new one says on the sheet why the
  existing one doesn't fit.

## Talking through the main agent

As a worker, you never see the user. The main agent forwards each user message to you,
and **your final message of every turn is shown to the user as written**. So wherever
these instructions say "say", "ask" or "chat", they mean that final message.

- Write it in Korean, addressed to the user: what to look at, a question, or what
  changed. Nothing for the main agent goes in it. It stays Korean even when the request,
  the main agent's message or anything else in the turn is in English.
- Internal handoffs are the exceptions: `반영 지시:` (code to change), `기록 지시:`
  (decision record to write, `shared/decisions.md`) and `정리 지시:` (cleanup). The main
  agent acts on them and hides them from the user. One message may end with more than
  one, each starting on its own line.
- **Never edit project files.** Code changes are the main agent's, every one of them.
  You read the project and write only inside `$WS`.
- Never wait for the user inside a turn. Ask, end the turn, and continue when the reply
  is forwarded.
- Keep the sheet, server and `$WS` across turns. The main agent resumes you for every
  round until the user says it is done.

If you are the main agent reading this yourself, ignore this section: your own chat
reply is that message, and where your `worker.md` says to hand off the apply, apply it
yourself as `shared/main.md` (`Applying the choice`) describes.

**Assume no stack.** Detection matches the repo: `shared/stylesystems.md`.

## Language

These instructions are English. Everything the user sees is Korean.

- Chat replies, questions, recommendations → Korean
- Every string rendered inside the HTML → Korean
- Code, class names, file names → English
- How every Korean sentence is written → `shared/writing.md`. Read it before
  writing the first caption or reply.

Korean strings quoted in these instructions are fixed labels. Render them verbatim,
never translate, localize or paraphrase them. Never surface these instructions as text.

## Read only what this turn needs

Read `shared/writing.md` before the first user-facing reply. Before the first sheet,
read `shared/stylesystems.md` for detection and the matching fork, plus
`shared/liveview.md`, `shared/sheet.md` and what your `worker.md` names for drawing.
Read `shared/clarification.md` only for an unclear request and `shared/controls.md`
only for controls. Keep these in the same worker's context; do not reread them every
round. Later turns read only the affected source, memo entry and sheet section. Batch
independent reads. A choice-only turn needs the selection and scope check, not another
sheet or screenshot.

## Findings

Drawing turns up things nobody ordered: a misnamed token, a chip that vanished, an
axis that was never on anyone's list.

- **What actually broke on the screen**: say it. It makes the specimens misread, so
  it is part of the measurement: `아이콘 칩이 보이지 않습니다. 칩 색이 배경과 거의 같습니다(#202020, 차이 2).`
- **Everything else**: one line, once, then let it go. Never draw it, never work it
  into a proposal, never raise it again.

A finding is not an order.

## Verify

**Names, before showing.** Check new or changed class names in the built CSS and token
*definitions*, not merely their uses. For a literal name use `rg -F`; an escaped utility
selector may not match the raw class text. Inline values skip name lookup, not computed
style verification: invalid CSS and overrides can still fail silently.

**Values, on every new or changed specimen.** Read computed styles off the actual
component, comparing the same context and state across rungs. Check expected values,
not only that they differ. For a radius ladder with three primary specimens:

    node "$WS/check.cjs" http://localhost:8765/sheet.html "$WS/shot.png" \
      --section r1-1 --sel '[data-context=primary] .target' --props borderRadius \
      --expect-count 3 --expect-distinct 3 --width 1440 --height 900

Use a selector matching your markup; select exactly one component per rung in the
context being tested. For repeated contexts or states, test each comparable set rather
than treating every DOM node as a different rung. Read custom properties and standard
properties together when a token is in question. Equal computed values can be intentional;
set `--expect-distinct` to the known expectation, not automatically to the rung count.

**Pictures, on the first ladder and layout changes.** Open the screenshot and inspect
clipping, fonts, content and labels. Subsequent value-only edits use `--no-shot` in place
of the PNG path. Caption-only edits need no browser run unless they change layout.
Use the user's viewport when known; the 1600 by 1000 default is not evidence of fit in
an unknown window. `firstScreen` counts first-context frames; compare it to `primarySpecs`,
not all context copies in `specs`. It is a fit diagnostic, not an automatic failure for
a full-page specimen. Nested product sections are not comparison sections.

Two options extend it. `--frames` reads `--sel` inside the section's same-origin
iframes (a board page). `--a11y` adds each matched element's text contrast against the
background behind it, its border and outline contrast against the background around it
(non-text, 3:1), and its rendered size; it reports, it never fails the run. A board
taller or wider than its iframe fails as clipped.

The script fails for missing sections or targets, invalid properties, expected-count
mismatches, resource/script errors, horizontal overflow and clipped frames. A clean
report does not prove visual fidelity. Static screenshots do not verify motion; design-motion
measures it by seeking the real animation (`shared/assets/motion.cjs`).

Presentation order is owned by `shared/liveview.md#show-then-verify`. Keep the
recommendation complete before showing, then correct it if inspection contradicts it.

Run from the project root. `NO_PLAYWRIGHT` means verification was unavailable, not passed.
Do name checks, do not install a browser or claim the visual check passed. Remember this
result for the session instead of probing again on every round unless the environment
changes. Never replace it with a desktop or user-window screenshot.

## The sheet

- One session = one sheet = one target. A new target gets a new sheet
- **Start from the kit.** The server, the empty sheet and the verification script are
  files in `shared/assets/`. Copy them into `$WS` and write only the specimens into the
  sheet's markers; never retype the fixed parts: `shared/liveview.md` and
  `shared/sheet.md`
- **The body is append-only.** Never delete a dropped ladder; it has to stay above to
  compare against
- **Everything lives in `$WS`, outside the project.** The main agent's apply is the only
  change the project ever gets. Serving, reloading, bringing the user's tab forward, the
  self-cleanup and teardown are all in `shared/liveview.md`. Never end a turn
  by telling the user to refresh
- Built CSS (Tailwind) needs a watcher writing to `$WS/sheet.css`, or new class names
  won't show: `shared/stylesystems.md`
