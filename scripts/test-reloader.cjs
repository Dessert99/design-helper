// 실제 리로더를 격리한 환경에서 실행해 버전과 오류 처리만 확인합니다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../shared/assets/sheet.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const script of scripts) new vm.Script(script);

function page({ protocol = 'http:', revision = 'old', fetch } = {}) {
  const state = { reloads: 0, calls: 0 };
  const sections = [{ scrollIntoView() {} }];
  const storage = new Map();
  const context = {
    history: {}, sessionStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    document: {
      querySelectorAll(selector) {
        assert.equal(selector, '.dh-main > section');
        return sections;
      },
      querySelector() { return revision ? { content: revision } : null; },
    },
    location: { protocol, href: 'http://localhost/sheet.html', reload() { state.reloads++; } },
    addEventListener() {}, scrollTo() {}, setTimeout, clearTimeout, AbortController,
    setInterval(fn) { state.poll = fn; },
    async fetch(...args) { state.calls++; return fetch(...args); },
  };
  vm.runInNewContext(scripts.at(-1), context);
  return state;
}
const response = (etag, ok = true) => ({ ok, headers: { get: () => etag } });
(async () => {
  let etag = '"old"';
  const stable = page({ fetch: async () => response(etag) });
  await stable.poll();
  assert.equal(stable.reloads, 0);
  etag = '"new"';
  await stable.poll();
  assert.equal(stable.reloads, 1);
  const earlyEdit = page({ fetch: async () => response('"new"') });
  await earlyEdit.poll();
  assert.equal(earlyEdit.reloads, 1);

  let fail = true;
  const retry = page({ fetch: async () => { if (fail) throw Error('연결 중단'); return response('"new"'); } });
  await retry.poll();
  assert.equal(retry.reloads, 0);
  fail = false;
  await retry.poll();
  assert.equal(retry.reloads, 1);
  const unavailable = page({ fetch: async () => response(null, false) });
  await unavailable.poll();
  assert.equal(unavailable.reloads, 0);

  const missingHeader = page({ fetch: async () => response(null) });
  await missingHeader.poll();
  assert.equal(missingHeader.reloads, 0);

  let finish;
  const busy = page({ fetch: () => new Promise(resolve => { finish = resolve; }) });
  const first = busy.poll();
  await busy.poll();
  assert.equal(busy.calls, 1);
  finish(response('"old"'));
  await first;
  assert.equal(page({ protocol: 'file:' }).poll, undefined);
  assert.equal(page({ revision: null }).poll, undefined);
  console.log('리로더 검사 9개를 통과했습니다. 브라우저 렌더링 검사는 포함하지 않습니다.');
})().catch(e => { console.error(e); process.exitCode = 1; });
