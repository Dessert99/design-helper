# Live view

Every ready revision is brought back to the user's browser, even if they switched
away or closed it. **Never end a turn with "새로고침하세요."** Editing, reloading,
verifying, and foregrounding the comparison are mine.

`file://` can't do this — a page there can't check whether its own file changed. So the
sheet is served, not opened as a file.

## The workspace

Everything this skill makes lives in **one directory outside the project**, created once
per session and deleted at the end:

    WS=$(mktemp -d)/design-helper    # or under the session's own scratch dir, if there is one
    mkdir -p "$WS"

The sheet, the server, the built CSS, the memo, screenshots, any entry
file a build tool needs, and the pid files below — all in `$WS`. **Nothing is ever written inside the project.** Not
a config, not a helper CSS, not a screenshot. The only project writes this skill makes
are the selected changes applied after each choice. If a tool seems to need a file in the project, it
doesn't — `references/stylesystems.md` has the flag or entry file that keeps it out.

Every background process gets a pid file so teardown can find it:

    ... >/dev/null 2>&1 & echo $! > "$WS/<name>.pid"

## Serve it

The server serves the comparison sheet and handles reload checks. Choices are sent
in chat, so no POST endpoint or choice log is needed.

```python
# $WS/serve.py
import http.server, os, shutil, signal, sys, time
D = os.path.dirname(os.path.abspath(__file__))
IDLE = 120
seen = time.monotonic()

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=D, **k)
    def setup(self):
        super().setup()
        self.connection.settimeout(5)
    def parse_request(self):
        global seen
        ok = super().parse_request()
        if ok: seen = time.monotonic()
        return ok
    def log_message(self, *a): pass

def cleanup():
    if not os.path.isdir(D): return
    for f in os.listdir(D):
        if f.endswith('.pid') and f != 'server.pid':
            try:
                with open(os.path.join(D, f)) as pidfile:
                    pid = int(pidfile.read())
                if pid > 1 and pid != os.getpid(): os.kill(pid, signal.SIGTERM)
            except (OSError, ValueError): pass
    # Delete only this session workspace, never its parent or the project.
    shutil.rmtree(D)

# Bind successfully before taking ownership of cleanup. A busy port must not erase D.
server = http.server.HTTPServer(('127.0.0.1', int(sys.argv[1])), H)
server.timeout = 1
try:
    while time.monotonic() - seen < IDLE:
        server.handle_request()
finally:
    server.server_close()
    cleanup()

```

Once per session, in the background:

    python3 "$WS/serve.py" 8765 >"$WS/server.log" 2>&1 &
    echo $! > "$WS/server.pid"

Port busy → walk up (8766, 8767...). Never kill whatever is already there. Then open the
URL, not the path:

    open http://localhost:8765/sheet.html

It binds `127.0.0.1`, not `0.0.0.0` — the sheet is on the user's machine and has no
business on the network.

## It reaps itself

After **120 seconds without a valid HTTP request**, the server stops serving, sends
SIGTERM to registered helper processes, deletes this session's entire `$WS` (including
HTML, CSS, memo, screenshots, server source, and PID files), and exits. It never removes
the project or the workspace's parent. Cleanup errors must remain visible in the server
log; do not silently claim deletion succeeded.

This measures request inactivity, not mouse/keyboard inactivity or tab visibility.
The reloader's HEAD requests keep the session alive while they continue. Closing all
comparison tabs normally stops those requests and starts the two-minute idle period.
A timeout can also occur if requests are suspended; do not promise permanent recovery.

Before editing or presenting, check both the workspace and server:

- Workspace present, server alive: reuse the session; requests reset the idle timer.
- Workspace present, server unexpectedly stopped: restart from that workspace.
- Workspace deleted by timeout: create a fresh workspace and regenerate the comparison
  from project code and available conversation context. Explain that the old temporary
  sheet expired. Do not claim its exact history or optional browser state was recovered.

Keep the sheet open during active work, or send legitimate health checks while preparing
an imminent revision. Do not add a separate keepalive that defeats abandoned-session
cleanup. User-confirmed completion still triggers immediate teardown below.

A wrapper that swallows SIGTERM can leave a watcher running; use directly managed
processes and check for survivors during explicit teardown. A hard crash/SIGKILL cannot
run cleanup. The `file://` fallback has no server or idle timer: disclose that automatic
two-minute cleanup is unavailable there, avoid background watchers, and clean up on
explicit completion. Do not promise an OS deletion deadline.

## The reloader

At the end of `<body>`, so the DOM is parsed when it runs. It polls the sheet's
`Last-Modified`, reloads when it moves, and lands where the user needs to be — on the
newest ladder if one was appended, otherwise exactly where they were reading.

```html
<script>
(() => {
  const S = sessionStorage;
  const n = document.querySelectorAll('section').length;
  const prev = +S.getItem('n') || 0, y = +S.getItem('y') || 0;
  S.setItem('n', n);

  let touched = false;
  const place = () => {
    if (touched) return;
    if (n > prev) document.querySelectorAll('section')[n - 1]?.scrollIntoView();
    else scrollTo(0, y);
  };
  addEventListener('load', place);
  document.fonts?.ready.then(place);
  addEventListener('scroll', () => { touched = true; S.setItem('y', scrollY); }, { passive: true });

  let seen = null;
  setInterval(async () => {
    const r = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
    const t = r.headers.get('last-modified');
    if (seen && t !== seen) location.reload();
    seen = t;
  }, 1000);
})();
</script>
```

One ladder per `<section>`, appended at the end — the count compares them and the last
one is where an append lands. Both are load-bearing; break them and the page reloads to
the top mid-comparison, which is the thing this exists to prevent. Turn dividers and
the table of contents (`references/sweeping.md#turn-dividers`,
`#the-table-of-contents`) are a `<div>` and a `<nav>`, not sections, so they never
change the count.

## After every edit

1. Wait past one poll (~1.5s) so the browser has picked it up
2. Verify — computed style and screenshot, per SKILL.md
3. When the revision is ready to present, foreground or reopen the user's comparison
   as described below and show the changed section
4. Then report, saying what to look at: `맨 아래 그림자 사다리입니다`

The screenshot comes from Playwright's own page at the same URL, so it and the user's
browser are looking at the same bytes.

**For optional interactive sheets, a reload wipes unsaved client state.** Scrub windows and context toggles
live in `sessionStorage` under `ctl:<section id>` and `ctx`, restored on
load by the engine in `references/controls.md`. Anything interactive added later goes
through the same two helpers or it dies on my next edit — which is the worst possible
moment, because the user was mid-comparison.

## Present every revision

This applies to the first sheet and each ready revision after user feedback, including
changes within an existing section. Do not steal focus during intermediate writes,
verification, background polling, or a conversation that produces no new comparison.

1. Ensure the same session's server and required CSS build are healthy, and the current
   sheet URL responds. If the workspace expired, regenerate it as described above;
   if only the server stopped, restart it and recover a watcher if needed. If the port is occupied,
   choose a free port and use the updated URL without killing unrelated processes.
2. With the available browser/desktop controls, locate the user's comparison tab by
   session URL or saved tab identity. Select it and activate its containing window/app.
   Open the sheet only after confirming that its tab is absent. If its tab exists,
   reuse it, including when its window is minimized or another tab is selected.
   A changed server port does not justify a duplicate: navigate the existing session
   tab to the updated URL. Track its tab/window identity for later revisions.
3. Ensure the latest content has loaded; explicitly reload if background polling was
   suspended. Scroll to the section being presented, whether it is new or edited in
   place. Keep optional interactive state when reusing the tab; a reopened tab may
   reset sessionStorage, so inspect what is actually displayed.
4. Verify the visible result when the available tools support it, then report. A
   screenshot from a separate verification tab or successful HEAD request does not
   establish that the user's browser was activated.

Use supported browser focus/activation controls, not a page-level `window.focus()`
call as proof of foregrounding. **Never blindly invoke a URL opener as a focus fallback:**
it may create a duplicate tab. Use a platform opener only when the comparison tab is
confirmed absent, such as when the browser was closed. If existing-tab detection or
activation is unavailable, preserve the existing session, briefly explain the limitation,
and provide the current URL. Do not open another tab to work around missing controls,
and do not claim that focus changed without evidence.

Closing a browser does not delete the session immediately; two minutes without requests
does. A revision within that interval reuses it; after expiry it requires regeneration.
Explicit session completion still uses the teardown below.

## No python3

Open the sheet on `file://` and say once that automatic reload is unavailable.
For each ready revision, reload through available browser controls and activate the tab,
or reopen the file URL. If neither is available, explain the limitation and ask for a
manual refresh. Do not build a replacement server workaround.

Without the server, automatic reload is unavailable. Selection still happens in chat,
and the client-side comparison controls still work.

## At the end

One command, when the user says it's done. It stops everything this skill started and
deletes everything it made:

    for f in "$WS"/*.pid; do kill "$(cat "$f")" 2>/dev/null; done; rm -rf "$WS"

Then check `git status` in the project for stray comparison files. Remove only those
temporary artifacts, preserving the applied changes and all existing user work.

If explicit teardown is not reached but the server remains running, the idle timer
stops its registered helpers and deletes `$WS` after two minutes without requests.
Hard crashes and the file-only fallback are exceptions described above. Applied project
changes remain untouched. A later session starts a fresh workspace.
