"""저장소 안의 임시 폴더에서 HTTP 응답과 새로고침 버전을 검증합니다."""
import importlib.util
import io
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'shared/assets'
spec = importlib.util.spec_from_file_location('sheet_server', ASSETS / 'serve.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class Connection:
    def __init__(self, request):
        self.request = io.BytesIO(request)
        self.response = bytearray()

    def makefile(self, *_):
        return self.request

    def sendall(self, data):
        self.response.extend(data)

    def settimeout(self, _):
        pass


class KitTests(unittest.TestCase):
    def setUp(self):
        self.ws = Path(tempfile.mkdtemp(prefix='.kit-test-', dir=ROOT))
        self.addCleanup(shutil.rmtree, self.ws)
        server.D = str(self.ws)
        self.html = self.ws / 'sheet.html'
        self.html.write_text((ASSETS / 'sheet.html').read_text() + '\n<!-- A -->')

    def request(self, path='/sheet.html', method='GET', extra=''):
        connection = Connection(f'{method} {path} HTTP/1.0\r\nHost: localhost\r\n{extra}\r\n'.encode())
        server.H(connection, ('127.0.0.1', 12345), None)
        head, body = bytes(connection.response).split(b'\r\n\r\n', 1)
        lines = head.decode().split('\r\n')
        headers = dict(line.split(': ', 1) for line in lines[1:])
        return int(lines[0].split()[1]), headers, body

    def test_loaded_revision_and_head_agree(self):
        status, headers, body = self.request()
        self.assertEqual(status, 200)
        revision = re.search(rb'name="dh-revision" content="([a-f0-9]+)"', body)[1].decode()
        self.assertEqual(headers['ETag'], f'"{revision}"')
        self.assertEqual(int(headers['Content-Length']), len(body))
        self.assertEqual(headers['Cache-Control'], 'no-store')
        _, head, empty = self.request(method='HEAD')
        self.assertEqual(head['ETag'], headers['ETag'])
        self.assertEqual(head['Content-Length'], headers['Content-Length'])
        self.assertEqual(empty, b'')

    def test_only_a_person_browser_arms_the_idle_cleanup(self):
        server.opened = False
        self.request(method='HEAD')                       # curl-like, no User-Agent
        self.request(extra='User-Agent: Mozilla/5.0 HeadlessChrome/131.0\r\n')
        self.assertFalse(server.opened)
        self.request(extra='User-Agent: Mozilla/5.0 (Macintosh) Chrome/131.0 Safari/537.36\r\n')
        self.assertTrue(server.opened)

    def test_browser_launcher_is_identical_in_both_scripts(self):
        def region(name):
            text = (ASSETS / name).read_text()
            return text[text.index('// >>> launch'):text.index('// <<< launch')]
        self.assertEqual(region('check.cjs'), region('walk.cjs'))

    def test_equal_length_equal_mtime_edit(self):
        _, before, _ = self.request()
        stamp = self.html.stat().st_mtime_ns
        self.html.write_text(self.html.read_text().replace('<!-- A -->', '<!-- B -->'))
        os.utime(self.html, ns=(stamp, stamp))
        _, after, _ = self.request(method='HEAD')
        self.assertNotEqual(before['ETag'], after['ETag'])
        self.assertEqual(before['Content-Length'], after['Content-Length'])

    def test_css_only_edit_and_unrelated_output(self):
        css = self.ws / 'sheet.css'
        css.write_text('.target { border-radius: 4px }')
        _, before, _ = self.request()
        css.write_text('.target { border-radius: 8px }')
        _, after, _ = self.request(method='HEAD')
        self.assertNotEqual(before['ETag'], after['ETag'])
        (self.ws / 'memo.md').write_text('선택: B')
        (self.ws / 'shot.png').write_bytes(b'image')
        _, unchanged, _ = self.request(method='HEAD')
        self.assertEqual(after['ETag'], unchanged['ETag'])

    def test_conditional_request_and_static_file(self):
        _, headers, _ = self.request()
        status, _, _ = self.request(extra=f'If-None-Match: {headers["ETag"]}\r\n')
        self.assertEqual(status, 200)
        (self.ws / 'tokens.css').write_text(':root { --radius: 6px }')
        status, _, body = self.request('/tokens.css')
        self.assertEqual(status, 200)
        self.assertIn(b'--radius: 6px', body)
        self.assertEqual(self.request('/missing.css')[0], 404)

    def test_missing_sheet_is_retryable(self):
        self.html.unlink()
        self.assertEqual(self.request()[0], 503)

    def test_checker_rejects_invalid_cli(self):
        for args in [[], ['url', '--no-shot', '--width', 'NaN'],
                     ['url', '--no-shot', '--sel', '.target'],
                     ['url', '--no-shot', '--unknown'],
                     ['url', '--no-shot', '--props']]:
            result = subprocess.run(['node', str(ASSETS / 'check.cjs'), *args], capture_output=True)
            self.assertEqual(result.returncode, 2, result.stdout)


if __name__ == '__main__':
    unittest.main()
