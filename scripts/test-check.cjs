// 브라우저 없이 검사기의 실패 판정과 보고서 계약을 검증합니다.
// CSS 계산과 실제 배치 검증은 이 시험에 포함하지 않습니다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../shared/assets/check.cjs'), 'utf8');

async function run({ values = ['4px', '8px', '12px'], prop = 'borderRadius', section = 'r1-1', count = 3,
  distinct = 3, clipped = false, error = false, hiddenContexts = false } = {}) {
  const targets = values.map(value => ({ value, getBoundingClientRect: () => ({ left: 10, right: 90, top: 10, bottom: 50 }) }));
  const frames = targets.map(() => ({
    scrollWidth: clipped ? 200 : 100, clientWidth: 100, scrollHeight: 60, clientHeight: 60,
    getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 60, width: 100, height: 60 }),
    querySelectorAll: () => [],
  }));
  const grid = {
    scrollWidth: 400, clientWidth: 400,
    querySelectorAll: selector => selector.includes('.dh-frame') ? frames : targets,
  };
  const root = {
    id: 'r1-1', getBoundingClientRect: () => ({ top: 0 }), querySelector: () => grid,
    querySelectorAll: selector => {
      if (selector === '.target') return targets;
      if (selector === '.spec') return hiddenContexts ? [...targets, ...targets] : targets;
      if (selector === '.dh-grid') return [grid];
      if (selector === '.dh-frame') return frames;
      return [];
    },
  };
  const listeners = {};
  const page = {
    on: (event, handler) => { listeners[event] = handler; },
    async goto() {
      if (error) listeners.pageerror(Error('표본 스크립트 오류'));
      return { ok: () => true };
    },
    evaluate: (fn, args) => fn(args),
    waitForFunction: async () => {},
  };
  const browser = { newPage: async () => page, close: async () => {} };
  const fakeRequire = name => name === '/virtual/playwright'
    ? { chromium: { launch: async () => browser } } : require(name);
  fakeRequire.resolve = () => '/virtual/playwright/package.json';
  let output;
  const processState = {
    argv: ['node', 'check.cjs', 'http://localhost/sheet.html', '--no-shot', '--section', section,
      '--sel', '.target', '--props', prop, '--expect-count', String(count), '--expect-distinct', String(distinct)],
    cwd: () => process.cwd(), env: {}, exit(code) { throw Error('예상하지 않은 종료: ' + code); },
  };
  const context = {
    require: fakeRequire, process: processState,
    console: { log: s => { output = JSON.parse(s); }, error: () => {} },   // failures also go to stderr; exits are caught above
    document: {
      fonts: { ready: Promise.resolve() }, documentElement: { scrollWidth: 1600, clientWidth: 1600 },
      querySelectorAll: selector => { assert.equal(selector, '.dh-main > section'); return [root]; },
    },
    innerWidth: 1600, innerHeight: 1000,
    getComputedStyle: el => ({ borderRadius: el.value, getPropertyValue: key => key === '--radius' ? el.value : '' }),
  };
  await vm.runInNewContext(source, context);
  return { report: output, exitCode: processState.exitCode || 0 };
}

(async () => {
  const normal = await run();
  assert.equal(normal.exitCode, 0);
  assert.equal(normal.report.ok, true);
  assert.equal(normal.report.distinct, 3);
  assert.equal(normal.report.shot, undefined);
  for (const options of [{ section: 'missing' }, { values: [] }, { prop: 'borderRaduis' },
    { prop: '--missing' }, { values: ['4px', '4px', '4px'] }, { count: 4 }, { clipped: true }, { error: true }]) {
    const result = await run(options);
    assert.equal(result.exitCode, 1, JSON.stringify(options));
    assert.equal(result.report.ok, false);
    assert.ok(result.report.issues.length);
  }
  assert.equal((await run({ prop: '--radius' })).exitCode, 0);
  const repeated = await run({ hiddenContexts: true });
  assert.equal(repeated.report.sections[0].specs, 6);
  assert.equal(repeated.report.sections[0].primarySpecs, 3);
  assert.equal(repeated.report.sections[0].firstScreen, 3);
  console.log('검사기 판정 11개를 통과했습니다. 브라우저 렌더링 검사는 포함하지 않습니다.');
})().catch(e => { console.error(e); process.exitCode = 1; });
