# Live view

The user opens the browser once and never touches it again. **Never end a turn with
"새로고침하세요."** Editing the sheet, reloading it and looking at the result are all
mine.

`file://` can't do this — a page there can't check whether its own file changed. So the
sheet is served, not opened as a file.

## Serve it

Once per session, in the background, from the scratchpad directory:

    python3 -m http.server 8765 --directory "$SCRATCH" >/dev/null 2>&1 &

Port busy → walk up (8766, 8767…). Never kill whatever is already there. Then open the
URL, not the path:

    open http://localhost:8765/sheet.html

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

## No python3

Fall back to reloading the user's browser directly, and keep the sheet on `file://`:

    osascript -e 'tell application "Google Chrome" to reload active tab of front window'
    osascript -e 'tell application "Safari" to tell front document to do JavaScript "location.reload()"'

It loses the scroll position and needs Automation permission the first time. If that
fails too, say so once and ask for a refresh — that is the last resort, not the default.

## At the end

Stop the server when the session ends, alongside throwing the sheet away.
