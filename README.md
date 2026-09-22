# design-helper

[English](README.md) | [한국어](README.ko.md)

> A Claude Code skill for settling CSS values, layout and motion by eye instead of in prose.

<!-- screenshot of a specimen sheet goes here -->

## Why

<!-- "12px or 16px?" in a chat window is not an answerable question -->

## What it does

<!-- a short trace of one cycle, in place of an explanation -->

### One work unit

<!-- one order = one axis = one ladder = one decision, then it stops -->
<!-- no stage list, no plan: what to look at next is always the user's call -->

### What it doesn't do

<!-- doesn't invent a design · doesn't plan the work for you · can't verify behavior (focus trap, keyboard, SR) -->
<!-- screenshots catch static state only, motion rests on your eyes -->

## What you get

<!-- the HTML specimen sheet is disposable; the deliverable is the applied code change -->

## Install

Clone it anywhere, then symlink that clone into the skills directory of whichever
agent you use. A symlink is a pointer, not a copy — edits to the clone take effect
immediately, and there is no second copy to keep in sync.

```sh
git clone https://github.com/Dessert99/design-helper.git ~/skills/design-helper

ln -sfn ~/skills/design-helper ~/.claude/skills/design-helper   # Claude Code
ln -sfn ~/skills/design-helper ~/.codex/skills/design-helper    # Codex
```

Both agents load it the same way. The `description` in `SKILL.md` is read at session
start; the body and everything under `references/` are read when the skill fires. So
edits to the body apply right away, while a changed `description` needs a new session.

To remove it, delete the symlink — `rm ~/.claude/skills/design-helper`. The clone is
untouched.

### Language

<!-- instructions are English, every reply and rendered string is Korean -->
<!-- how to switch: edit the ## Language section in SKILL.md -->

## Docs

<!-- SKILL.md + references/{sweeping,controls,stylesystems,motion,liveview}.md -->

## License
