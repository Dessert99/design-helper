# Running a design-helper skill (main agent)

Every skill in this plugin runs the same way. The skill's `SKILL.md` sent you here and
named its `worker.md`. This file is how you, the main agent, run it.

The work happens in a worker agent so this conversation stays small. Reading the
project code, drawing the sheet, serving it and screenshots all fill a lot of context.
The worker does them; you talk to the user and pass messages. **Every change to the
project code is yours.** The worker never edits it: on a choice it hands you exactly what
to change, and you apply it.
Everything the user sees is Korean.

Do not read the skill's `worker.md` or `core.md` unless you end up doing the work
yourself (see the last section).

## Start the worker

Spawn one worker per comparison target, right away: don't list, read or search
anything first. The worker reads the project itself. Its first message holds:

- `Read <absolute path of the skill's worker.md> and follow it.`
- `Plugin root: <absolute path>` (the one `SKILL.md` told you how to find)
- the user's request, quoted as written
- the target, if you know it: files, component, route
- what the conversation already settled about this target, with values
- the project root, as an absolute path
- the decision record's location, if the user named one (a Notion link)

Which agent to spawn:

- **Claude Code with this plugin installed**: subagent type `design-helper:worker`.
- **Claude Code without it** (the skill was copied or linked in): a general-purpose
  subagent.
- **Codex**: use the available `spawn_agent` schema, with isolated context
  (`fork_turns: "none"`, or `fork_context: false` if that is the exposed field).
  Do not pass fields the tool does not accept. These instructions explicitly request a
  comparison subagent.

Tell the user in one short Korean line that the comparison is being drawn, then wait
for the worker's result (Claude Code notifies you; in Codex, `wait_agent`).

## Every round

- **Show the worker's final message as written.** Do not summarize, translate, add a
  next step, or answer the question it asked.
- **Forward each user reply about the comparison as written**, to the same worker:
  `SendMessage` in Claude Code; in Codex, `send_input` or `followup_task`, whichever
  your tools have. Letters, impressions, refinements, `이걸로 가자`, `끝났어`: all of
  them go to the worker, which knows what they mean. Do not interpret a letter
  yourself, and do not edit the sheet yourself.
- A message that clearly has nothing to do with the comparison is yours to handle. If
  you can't tell, forward it.
- The user says it is done (`끝났어`, `됐어`): forward it, show the worker's last
  message, and close the worker if your tools can (`close_agent` in Codex). If that
  message ends with a `정리 지시:` block, show only what is above it, write any `기록 지시:`
  first, then delete exactly the paths it lists only when creation by this session is
  established (a `작업 폴더:` line is the worker's own workspace, so it is). A filename or
  untracked status alone is not evidence. Preserve uncertain files. Report cleanup briefly.

## Applying the choice

When the user picks, the worker's message ends with a `반영 지시:` block, a `기록 지시:`
block, or both. In the same turn, show the user everything above the first block, as
written, then write the record (next section), then apply the code. With no `반영 지시:`
block, stop after the record.

1. Nothing from the blocks is shown to the user.
2. Apply the `반영 지시:` block, without asking again: the user's pick was the apply order. Change what the
   block lists, within the scope it states. If the code differs from it (the line moved,
   a name is missing), resolve it from the code; ask only if that would change the scope.
3. Verify. Every class, token and `var(--x)` you wrote must exist: a wrong name fails
   silently and simply doesn't show. Run the check under `검증` if there is one, and the
   project's own quick checks (typecheck, lint) when the change could break them. In a
   project with a decision record, also run the check in `shared/agent-guide.md`
   (`Checking before delivering`) on the lines you changed.
   If the block has an `안내 블록:` line, write or update the agent block as
   `shared/agent-guide.md` says, asking first when it is the first insertion.
4. Report in one short Korean message: the files you changed and what you verified. The
   worker already gave the blast radius; don't repeat it.
5. Start your next message to the worker with `반영 완료:` and the files you changed, or
   what failed, ahead of the forwarded user reply. It draws the next ladder on top of
   that code.

## Writing the record

A `기록 지시:` block lists exactly what to write (`shared/decisions.md`, `Recording`).

1. Copy each screenshot it names out of the workspace first: the workspace may be
   removed soon.
2. Write the lines into the named file (or Notion page), the `README.md` checklist row,
   and any `보관` links. Create the folder and files from the templates in
   `shared/decisions.md` when they don't exist yet. Change nothing it doesn't list.
3. Report in one short Korean line which file changed, and pass on its `다시 볼 곳:`
   line when there is one.
   The first time the project gets a record, also add the agent block
   (`shared/agent-guide.md`): ask the question there once, and add it on a yes.
4. Start your next message to the worker with `기록 완료:` and the files, or what
   failed.

Writing the record needs no extra question: the user's pick was the order. Writing it
outside the project (Notion) follows the same block.

## When the worker is gone

If the worker can't be resumed (it was closed, the session restarted, or a message to it
fails), spawn a new one. Its first message adds the settled values from the earlier
reports, the active axis and its last letter. Continue letters only for that active
unit; a newly ordered axis starts at A. Include any known workspace and sheet URL.

## Doing it yourself

If you can't spawn a subagent (no such tool, it is turned off, or you are already a
subagent), read the skill's `worker.md` and follow it yourself, with the plugin root
you found. Your chat replies then take the place of the worker's final message, and on
a choice you skip the block and apply as `Applying the choice` says.
