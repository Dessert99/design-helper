# Live view

Every ready revision is brought back to the user's browser, even if they switched
away or closed it. **Never end a turn with "새로고침하세요."** Editing, reloading,
verifying, and foregrounding the comparison are mine.

`file://` can't do this — a page there can't check whether its own file changed. So the
sheet is served, not opened as a file.

## The workspace

Everything this skill makes lives in **one directory outside the project**, created once
per session and deleted at the end:

    WS=$(mktemp -d "${TMPDIR:-/tmp}/<skill name>.XXXXXX")   # or a new folder in the session's scratch dir

`$WS` is the whole workspace, with nothing above it to clean up. Teardown deletes
`$WS` itself and nothing else.

The sheet, the server, the built CSS, the memo, screenshots, any entry file a build
tool needs, and the pid files below — all in `$WS`. **Nothing is ever written inside
the project** except the selected changes the main agent applies after each choice. If a tool seems
to need a file in the project, it doesn't — `shared/stylesystems.md` has the flag or
entry file that keeps it out.

Every background process gets a pid file so teardown can find it:

    ... >/dev/null 2>&1 & echo $! > "$WS/<name>.pid"

## The kit

The fixed parts are files in `shared/assets/`. Copy them into `$WS` once
per workspace, right after creating it, and never retype them:

    A=<plugin root>/shared/assets
    cp "$A/serve.py" "$A/sheet.html" "$A/check.cjs" "$A/walk.cjs" "$WS/"

- `serve.py`: the server below
- `sheet.html`: the empty sheet, with the sheet style, the table of contents and the
  reloader already in it (`shared/sheet.md`)
- `check.cjs`: computed styles and optional screenshot in one run (`shared/core.md#verify`)
- `walk.cjs`: walks a task through a prototype page, one screenshot per step, with clicks,
  inputs, screen changes, list position and a keyboard-only run (design-ux)

The skill that needs them copies these as well, from the same folder:

- `icons.cjs`, `pixel.cjs` (design-brand): public icon sets gathered per concept; a logo
  or icon rendered at its real sizes, enlarged, measured and exported
- `motion.js`, `motion.cjs` (design-motion): the play bar that runs a section's specimens
  on one clock; the measurement that seeks the real animation for frames and a graph

## Serve it

`$WS/serve.py` is a static file server for `$WS` that sends `Cache-Control: no-store`
and reaps itself (below). Once per session, in the background:

    python3 "$WS/serve.py" 8765 >"$WS/server.log" 2>&1 &
    echo $! > "$WS/server.pid"

**Make sure the server that answers is yours.** Another session's server may already
hold the port and answer every request, so a `200` proves nothing. Write a token only
this workspace has and read it back:

    echo "$WS" > "$WS/dh-id.txt"
    sleep 1; kill -0 "$(cat "$WS/server.pid")" &&
      [ "$(curl -s http://localhost:8765/dh-id.txt)" = "$WS" ] && echo OURS

No `OURS` (the process died, or the log says the address is in use): try the next port
(8766, 8767...) the same way. Never kill whatever is already there. Every later check
of "is it served" reads `dh-id.txt` the same way. When the
first sheet is ready (`Show, then verify` below), open the URL, not the path:

    open http://localhost:8765/sheet.html

It binds `127.0.0.1`, not `0.0.0.0` — the sheet is on the user's machine and has no
business on the network.

## It reaps itself

The clock starts only once a person's browser has opened the sheet. Headless checks
(`check.cjs`) and `curl` keep the session alive but don't start it. After that, **30
minutes without a request** make the server send SIGTERM to registered helpers, delete
this session's entire `$WS`, and exit. A sheet no browser ever opens is cleaned up after
4 hours, so an abandoned session doesn't linger. It never removes the project or the
workspace's parent. Cleanup errors stay visible in the server log.

The reloader's HEAD requests keep the session alive while an open tab polls. Closing
every comparison tab, or a browser suspending the tab, starts the 30-minute clock. A
long turn on the agent's side (writing a record, applying code) never empties the
workspace while the user's tab is open, and never before the user has seen the sheet.

Before editing or presenting, check both the workspace and server:

- Workspace present, server alive: reuse the session; requests reset the idle timer.
- Workspace present, server unexpectedly stopped: restart from that workspace.
- Workspace deleted by timeout: the user closed the page, so they no longer need what
  was on it. Create a fresh workspace and draw **only what the new request asks for** —
  never rebuild the old ladders. If the request points back at an old specimen
  (`B랑 새 거 비교`), draw just that specimen beside the new ones. Rewrite `memo.md` from
  the settled values in the conversation so the new ladder still sits on top of them.
  Letters and turn numbers continue from the chat (`D`, `요청 3`), so a letter the user
  already said never means two things. Say it in one line, e.g.
  `이전 시안 페이지는 닫혀서 정리됐습니다. 이번 요청만 새 페이지에 그립니다.` — never
  offer to restore it, and never claim its history was recovered.

Don't add a keepalive that defeats this cleanup. A wrapper that swallows SIGTERM can
leave a watcher running, so manage processes directly and check for survivors at
teardown. A hard crash cannot run cleanup.

## The reloader

The last script in `shared/assets/sheet.html`, at the end of `<body>`, so the DOM is parsed when
it runs. Keep it as copied. The server embeds a content revision in the HTML and
returns it as an ETag on HEAD. The revision covers the HTML and workspace CSS, so
same-length edits within one second and a later CSS build both trigger a reload.
Polling compares against the loaded revision, never a first-poll baseline. Failed
requests keep the current page and retry; `file://` does not poll.

Use one direct child `<section>` of `.dh-main` per ladder, appended at the end. Only
these sections count for reload landing and the table of contents; nested sections in
real product markup do not count. A new ladder lands at its top; otherwise the page
restores its scroll position. Keep section IDs stable.

## Show, then verify

A revision is ready once its content is written, every caption and the recommendation
included, and its names are checked. Every ready revision takes these steps: the first
sheet, an appended ladder, and an edit inside an existing section alike.

1. **Check names** (`shared/core.md#verify`, Names). It takes a second and catches
   the failure that shows nothing at all, so it runs before anyone sees the sheet.
2. **Make sure it is served.** The server (and CSS watcher, if any) is up and the sheet
   URL answers from your workspace (`dh-id.txt`, above). Workspace gone → a fresh sheet as above; server stopped → restart it.
   Port taken → pick a free one; never kill what is already there.
   Reuse the successful readiness check from this edit; do not probe the same server
   again without a failure or delay.
3. **Bring it to the user.** With the browser or desktop controls you have, find the
   user's comparison tab by its URL, select it, bring its window forward, reload it if
   polling was suspended and session permissions allow it, and scroll to the section.
   **Never open a second tab for the same sheet**: open the URL only after confirming no such tab exists, and if the port
   changed, navigate the existing tab instead. Use those controls, not a page-level
   `window.focus()`, and never a URL opener as a focus fallback.
4. **Verify** at the frequency in `shared/core.md#verify`: values for changed specimens,
   pictures for the first ladder or layout changes. Fix what it finds in the sheet;
   the open tab picks up the fix on its next poll and keeps its scroll position. Fixes are not presented again.
5. **Report**, saying what to look at: `맨 아래 그림자 사다리입니다`. If you couldn't
   find or activate the tab, say so in one line and give the URL. A screenshot from
   your own headless page or a successful HEAD request does not show that the user's
   tab came forward; don't claim it did.

Showing comes before verifying: the user's tab reloads by itself, so a fix made during
verification reaches them without another step, and they are not left on an empty
screen while it runs. The screenshot comes from Playwright's own page at the same URL,
so it and the user's browser are looking at the same bytes. Don't steal focus for
fixes or for a turn that produces nothing new to compare.

Two cases verify before showing instead: a sheet with controls
(`shared/controls.md`), and a sheet on `file://` (below), which can't reload itself.
An optional interactive sheet keeps its state across reloads as `shared/controls.md`
describes.

## No python3

Open the sheet on `file://` and say once that automatic reload and the automatic
cleanup are unavailable. Verify each revision before showing it, then reload the tab
through browser controls or ask for a manual refresh. Don't build a replacement server.

## At the end

One command, when the user says it's done. It stops everything this skill started and
deletes everything it made:

    for f in "$WS"/*.pid; do kill "$(cat "$f")" 2>/dev/null; done; rm -rf "$WS"

When that last message also ends with a `기록 지시:` that names screenshots in `$WS`, the
main agent copies them after the turn, so keep the folder: stop the processes only, and
end with a `정리 지시:` line `- 작업 폴더: <$WS>`. The main agent removes it after writing
the record.

Say in the final message that the comparison tab can be closed: it no longer loads.

Then run `git status` in the project. Nothing from this skill belongs there except the
applied changes, the decision record (`design-decisions/`) and the agent block in
`AGENTS.md` and `CLAUDE.md` (`shared/agent-guide.md`), all written by the main agent. If a comparison file shows up anyway, don't delete it yourself: end
the final message with a block for the main agent. Include only files whose creation
by this session is established; a name or untracked status alone is not enough. Preserve
uncertain files. The main agent removes only the established comparison artifacts:

    정리 지시:
    - 지울 파일: src/tailwind.config.sheet.ts
