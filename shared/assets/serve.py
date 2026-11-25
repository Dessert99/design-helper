import hashlib, http.server, io, os, pathlib, shutil, signal, sys, time
D = os.path.dirname(os.path.abspath(__file__))
IDLE = 1800            # idle seconds after a person's browser has opened the sheet
UNOPENED = 4 * 3600    # lifetime cap when no person's browser ever opens it
started = seen = time.monotonic()
opened = False         # a non-headless browser has requested something

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=D, **k)
    def setup(self):
        super().setup()
        self.connection.settimeout(5)
    def parse_request(self):
        global seen, opened
        ok = super().parse_request()
        if ok:
            seen = time.monotonic()
            # Headless checks (check.cjs) and curl keep the session alive but don't count
            # as the user opening the sheet.
            agent = self.headers.get('User-Agent', '')
            if 'Mozilla' in agent and 'Headless' not in agent: opened = True
        return ok
    def end_headers(self):
        # Never answer a reload from cache: If-Modified-Since has 1s resolution and would
        # serve a stale sheet after two edits within the same second.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def send_head(self):
        if self.path.split('?', 1)[0] != '/sheet.html':
            return super().send_head()
        try:
            body = pathlib.Path(D, 'sheet.html').read_bytes()
            digest = hashlib.sha256(body)
            # Hash the workspace CSS too, so a watcher build that lands after the HTML still reloads.
            for css in sorted(pathlib.Path(D).rglob('*.css')):
                digest.update(str(css.relative_to(D)).encode())
                digest.update(b'\0')
                digest.update(css.read_bytes())
        except OSError:
            self.send_error(503, 'Service Unavailable', 'Cannot read the sheet.')
            return None
        revision = digest.hexdigest()
        # GET and HEAD carry the same revision: the body embeds it, the ETag repeats it.
        meta = f'<meta name="dh-revision" content="{revision}">'.encode()
        body = body.replace(b'<!-- dh:revision -->', meta, 1)
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('ETag', f'"{revision}"')
        self.end_headers()
        return io.BytesIO(body)
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

def main():
    # Bind successfully before taking ownership of cleanup. A busy port must not erase D.
    server = http.server.HTTPServer(('127.0.0.1', int(sys.argv[1])), H)
    server.timeout = 1
    try:
        while True:
            now = time.monotonic()
            if opened and now - seen >= IDLE: break
            if not opened and now - started >= UNOPENED: break
            server.handle_request()
    finally:
        server.server_close()
        cleanup()

if __name__ == '__main__':
    main()
