# Making every agent follow the decisions

A record nobody reads changes nothing. Any agent that edits this project later, inside
these skills or in ordinary coding, has to find the decisions, use only settled values,
and send changes back through a sheet. This file is the mechanism. It is adapted from
how Astryx (`meta/astryx`, MIT) makes agents follow its design system: a managed block
in the project's agent files, look up instead of guess, and check before delivering.

## The block

The main agent writes this block into the project's agent files. Keep it short: every
session of every agent in the project loads it.

```markdown
<!-- DESIGN-DECISIONS:START -->
This project's design decisions live in `design-decisions/` (README.md lists them).
- Before building or changing UI, read the matching file (typography, color, spacing, shape).
  Before building or changing a feature, read its `ux-*.md` and follow its flow, patterns,
  states and wording; its 완료 조건 says when the feature works.
- Use only values marked `확정`, through their tokens. Never invent a value. If what you
  need is undecided, use the nearest existing token and tell the user it is undecided.
  A `확정` value the code has no token for yet is not hardcoded: tell the user and point to
  /design-helper:design-sync (Codex: $design-sync).
- Do not change a decision, in code or in these files. Changes go through
  /design-helper:design-system or /design-helper:design-ux (Codex: $design-system,
  $design-ux), where they are drawn before they are chosen.
- Before delivering UI, re-read the changed files and replace hardcoded colors, px
  sizes and font values with the decided tokens.
<!-- DESIGN-DECISIONS:END -->
```

When the record is in Notion, the first line names the Notion page instead of the folder.

## Where it goes

- `AGENTS.md` at the project root (Codex and many other agents read it).
- `CLAUDE.md` at the project root (Claude Code reads it). Skip it when it already imports
  `AGENTS.md` (`@AGENTS.md`), so the block isn't loaded twice.
- A file that doesn't exist yet is created with the block alone.

## Writing and updating

- Only the text between the two markers belongs to this plugin. Replace that span; never
  touch anything outside it. Two marker pairs in one file: stop and report, don't guess.
- **The first insertion asks once**, because it changes every future agent session in
  the project: `AGENTS.md와 CLAUDE.md에 디자인 결정을 따르라는 안내를 넣을까요?` Later
  updates of an existing block need no question.
- Insert it the first time any skill writes the record (`shared/main.md`, Writing the
  record), so a record made by one skill alone is already followed. The block's own rule
  keeps agents from hardcoding settled values the code doesn't have yet. design-sync
  updates it on every apply.
- The user asks to remove it: delete the span with its markers, nothing else.

## Checking before delivering

After every code change that came from a decision (a `design-sync` apply, or a
design-helper apply in a project with a record), the main agent checks the changed lines:

- hardcoded colors (`#hex`, `rgb(`, `hsl(`, `oklch(`), px sizes, font families or sizes
  that a decided token covers
- any of them found: replace with the token when the mapping is exact; otherwise list
  them in the report as `토큰 대신 직접 쓴 값: <file:line> <value>`

Token definitions themselves and values the record leaves undecided are not findings.
