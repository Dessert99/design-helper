# Live view

The user opens the browser once and never touches it again. **Never end a turn with
"새로고침하세요."** Editing the sheet, reloading it and looking at the result are all
mine.

`file://` can't do this — a page there can't check whether its own file changed. So the
sheet is served, not opened as a file.

## The workspace

Everything this skill makes lives in **one directory outside the project**, created once
per session and deleted at the end:

    WS=$(mktemp -d)/design-helper    # or under the session's own scratch dir, if there is one
    mkdir -p "$WS"

The sheet, the server, the built CSS, the memo, `state.jsonl`, screenshots, any entry
file a build tool needs, and the pid files below — all in `$WS`. **Nothing is ever written inside the project.** Not
a config, not a helper CSS, not a screenshot. The only project writes this skill makes
are the apply edits at the very end. If a tool seems to need a file in the project, it
doesn't — `references/stylesystems.md` has the flag or entry file that keeps it out.

Every background process gets a pid file so teardown can find it:

    ... >/dev/null 2>&1 & echo $! > "$WS/<name>.pid"

## Serve it

The sheet doesn't only read from the server, it writes back to it — `이걸로 확정`
POSTs the choice. `http.server` on its own answers GET and HEAD, so write the server
into `$WS` too:

```python
# $WS/serve.py
import http.server, os, signal, sys, threading, time
D = os.path.dirname(os.path.abspath(__file__))
IDLE = 600
seen = time.time()

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=D, **k)
    def handle_one_request(self):
        global seen; seen = time.time()
        super().handle_one_request()
    def do_POST(self):
        n = int(self.headers.get('content-length') or 0)
        line = self.rfile.read(n).decode('utf-8').replace('\n', ' ')
        with open(os.path.join(D, 'state.jsonl'), 'a', encoding='utf-8') as f:
            f.write(line + '\n')
        self.send_response(204); self.end_headers()
    def log_message(self, *a): pass

def reap():
    while time.time() - seen < IDLE: time.sleep(max(1, IDLE / 20))
    for f in os.listdir(D):
        if f.endswith('.pid') and f != 'server.pid':
            try: os.kill(int(open(os.path.join(D, f)).read()), signal.SIGTERM)
            except Exception: pass
    os._exit(0)

threading.Thread(target=reap, daemon=True).start()
http.server.HTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
```

Once per session, in the background:

    python3 "$WS/serve.py" 8765 >/dev/null 2>&1 &
    echo $! > "$WS/server.pid"

Port busy → walk up (8766, 8767…). Never kill whatever is already there. Then open the
URL, not the path:

    open http://localhost:8765/sheet.html

It binds `127.0.0.1`, not `0.0.0.0` — the sheet is on the user's machine and has no
business on the network.

## It reaps itself

The teardown below only runs when the user says they are done. A closed terminal, a
crash, someone walking away — none of those reach it, and a server holding a port would
survive every one of them, one more per abandoned session.

The reloader polls `HEAD` once a second, so **the server knows whether anyone is still
looking.** Ten idle minutes means no tab is open: the reaper SIGTERMs every pid in `$WS`
and exits.

It leaves `$WS` on disk on purpose — `memo.md` and `state.jsonl` are in there and an
accidentally closed tab must not destroy a session's record. Only the processes leak.

**So the server can be gone while the session isn't.** Before editing the sheet, check
it, and start it again on the same `$WS` if it died:

    kill -0 "$(cat "$WS/server.pid")" 2>/dev/null || { python3 "$WS/serve.py" 8765 ... }

Two things this does not cover, and neither is worth pretending about:

- a watcher started through a wrapper that swallows SIGTERM outlives the reaper. The
  check is `ps aux | grep tailwindcss`, and it is the one process that can survive
- on the `file://` fallback there is no server, so there is no reaper either. In that
  mode **don't background a watcher** — rebuild once per edit instead

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
    if (n > prev) document.getElementById('latest')?.scrollIntoView();
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

One ladder per `<section>`, and `id="latest"` moves to the newest one on every append —
that's what the count compares. Both are load-bearing; drop them and the page reloads to
the top mid-comparison, which is the thing this exists to prevent.

## After every edit

1. Wait past one poll (~1.5s) so the browser has picked it up
2. Verify — computed style and screenshot, per SKILL.md
3. Then report, saying what to look at: `맨 아래 그림자 사다리입니다`

The screenshot comes from Playwright's own page at the same URL, so it and the user's
browser are looking at the same bytes.

**A reload wipes client state unless it was saved.** Scrub windows, context toggles and
pins live in `sessionStorage` under `ctl:<section id>`, `ctx` and `pins`, restored on
load by the engine in `references/controls.md`. Anything interactive added later goes
through the same two helpers or it dies on my next edit — which is the worst possible
moment, because the user was mid-comparison.

## What the sheet sends back

`$WS/state.jsonl`, one JSON object per line, appended by the server. Written by the
user's clicks, never by me.

**Read it at the start of every turn, before anything else.** A line newer than my last
turn is the user pointing at a specimen:

    tail -n 3 "$WS/state.jsonl"

`kind: "choice"` is a decision — record the memo line and stop, exactly as if they had
typed `C로 갈게`. `kind: "anchor"` is a starting point from the blank-slate matrix, and
is not a decision — `references/sweeping.md`.

If there is no new line, nothing was chosen. The file is evidence, not a queue: never
act on a line already handled, and never treat silence as approval.

## No python3

Open the sheet on `file://`, say once that reloads are manual, and ask for a refresh
after each edit. Don't build a workaround around it.

Half the skill goes with the server: no auto-reload, and `이걸로 확정` can't record — it
flashes `기록 실패 — 채팅으로 알려주세요` and the choice comes back in chat. Everything
else in `references/controls.md` is client side and still works.

## At the end

One command, when the user says it's done. It stops everything this skill started and
deletes everything it made:

    for f in "$WS"/*.pid; do kill "$(cat "$f")" 2>/dev/null; done; rm -rf "$WS"

Then `git status` in the project. It must show nothing of mine. If it does, the
workflow leaked — delete the file, and say what it was and why it appeared, because
that is a bug in these instructions, not a one-off.

A session that ends without reaching this — crash, user walked away — is handled by the
reaper above: within ten idle minutes the processes stop on their own and the temp
directory is left for the OS to reclaim. The next session starts a fresh `$WS`, and if
an abandoned server is still inside its ten minutes the port walk steps around it.
Either way the project is untouched and there is nothing for the user to kill.
