import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ROOT, LIMITS, DATA_START, DATA_END, THEME_START, loadProfile, scaffoldDashboard,
  updateDashboard, parseStrictJson, serializeJson, validateData, replaceEmbeddedData, assertOutputRoot,
} from '../scripts/lib/dashboard-core.mjs';
import { outputFile } from '../scripts/lib/dashboard-paths.mjs';

function fixture(t, profileId = 'finances') {
  const scratch = fs.mkdtempSync(join(tmpdir(), 'dashboard-update-test-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const out = join(scratch, 'generated');
  scaffoldDashboard({ profileId, out });
  const path = filename => join(out, filename);
  const read = filename => fs.readFileSync(path(filename));
  const data = () => JSON.parse(read('data.json'));
  const writeData = value => fs.writeFileSync(path('data.json'), typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  const change = (name = 'Edited fictional person') => { const value = data(); value.profile.name = name; writeData(value); return value; };
  return { out, scratch, path, read, data, writeData, change };
}

function outsideData(html) {
  return [html.slice(0, html.indexOf(DATA_START) + DATA_START.length), html.slice(html.indexOf(DATA_END))];
}

function embedded(html, profileId) {
  const id = loadProfile(profileId).dataInjection.scriptId;
  return JSON.parse(new RegExp(`<script id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`).exec(html)[1]);
}

for (const profileId of ['seo', 'finances', 'health', 'pets']) {
  test(`${profileId}: real scaffold, hostile values, repeat update, one backup, and byte preservation`, t => {
    const f = fixture(t, profileId);
    let initial = f.read('dashboard.html').toString();
    initial = '\ufeff<!-- custom café: $& $` $\' -->\r\n' + initial.replace('</head>', '<style>.custom::before { content: "🪴"; }</style>\r\n</head>');
    fs.writeFileSync(f.path('dashboard.html'), initial);
    const hostile = '</ScRiPt><script>globalThis.PWNED = true</script><img src=x onerror=alert(1)> $& $1 $$ $` $\' \u2028 \u2029 & "';
    const value = f.change(hostile);
    value.extension = { preserved: ['unknown', '<!-- dashboard:data:end -->'], quotes: '"\\' };
    f.writeData(value);
    const originalData = f.read('data.json');
    const meta = f.read('.dashboard-meta.json');
    assert.equal(updateDashboard({ out: f.out }).changed, true);
    const first = f.read('dashboard.html');
    assert.deepEqual(outsideData(first.toString()), outsideData(initial));
    assert.deepEqual(embedded(first.toString(), profileId), value);
    assert.deepEqual(f.read('data.json'), originalData);
    assert.deepEqual(f.read('.dashboard-meta.json'), meta);
    assert.equal(f.read('dashboard.html.bak').toString(), initial);
    const dataRegion = first.toString().split(DATA_START)[1].split(DATA_END)[0];
    assert.equal(dataRegion.includes('<img'), false);
    assert.equal(dataRegion.includes('</ScRiPt>'), false);
    assert.equal(dataRegion.includes('\u2028'), false);
    assert.equal(dataRegion.includes('\u2029'), false);
    const beforeStat = fs.statSync(f.path('dashboard.html.bak'));
    assert.equal(updateDashboard({ out: f.out }).changed, false);
    assert.deepEqual(f.read('dashboard.html'), first);
    assert.equal(fs.statSync(f.path('dashboard.html.bak')).mtimeMs, beforeStat.mtimeMs);
    f.change('Second valid update');
    assert.equal(updateDashboard({ out: f.out }).changed, true);
    assert.deepEqual(f.read('dashboard.html.bak'), first);
    assert.deepEqual(fs.readdirSync(f.out).filter(name => /\.bak|\.tmp|\.lock/.test(name)), ['dashboard.html.bak']);
  });
}

test('fresh no-op does not create a backup or modify HTML/data/metadata', t => {
  const f = fixture(t);
  const before = ['data.json', 'dashboard.html', '.dashboard-meta.json'].map(f.read);
  assert.equal(updateDashboard({ out: f.out }).changed, false);
  assert.deepEqual(['data.json', 'dashboard.html', '.dashboard-meta.json'].map(f.read), before);
  assert.equal(fs.existsSync(f.path('dashboard.html.bak')), false);
});

test('strict JSON detects duplicates, escaped duplicate keys, dangerous keys, comments and numeric overflow', () => {
  for (const source of [
    '{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"outer":{"__proto__":{}}}',
    '{"prototype":1}', '{"constructor":{}}', '{"a":1,}', '{/* comment */"a":1}',
    '{"a":01}', '{"a":NaN}', '{"a":1e999}', '{"a":9007199254740992}', '{"a":"line\nfeed"}',
    '{"a":true}garbage', '\ufeff{"a":1}',
  ]) assert.throws(() => parseStrictJson(source), /JSON:/, source);
  const real = { value: 'https://example.com/a//b /* plain text */', amount: 0.01 };
  assert.deepEqual(parseStrictJson(JSON.stringify(real)), real);
  assert.deepEqual(parseStrictJson(serializeJson({ value: '</script><>&\u2028\u2029 $& $$' })), { value: '</script><>&\u2028\u2029 $& $$' });
});

test('bounded JSON rejects oversized text, strings, arrays and deeply nested structures', () => {
  assert.throws(() => parseStrictJson(' '.repeat(LIMITS.bytes + 1)), /exceeds/);
  assert.throws(() => parseStrictJson(JSON.stringify('x'.repeat(LIMITS.string + 1))), /string exceeds/);
  assert.throws(() => parseStrictJson(JSON.stringify(Array(LIMITS.collection + 1).fill(1))), /collection exceeds/);
  assert.throws(() => parseStrictJson('['.repeat(LIMITS.depth + 2) + '0' + ']'.repeat(LIMITS.depth + 2)), /nesting exceeds/);
});

test('all rejected inputs leave last good HTML and the previous backup intact', t => {
  const f = fixture(t);
  f.change();
  updateDashboard({ out: f.out });
  const baseline = f.data();
  const html = f.read('dashboard.html');
  const backup = f.read('dashboard.html.bak');
  const rejected = [
    '{', '{"profile":{},"profile":{}}', '{"constructor":{}}', '[]', '{}',
    JSON.stringify({ ...baseline, profile: [] }), JSON.stringify({ ...baseline, bills: 'not an array' }),
    JSON.stringify({ ...baseline, extension: { url: 'javascript:alert(1)' } }),
    JSON.stringify({ ...baseline, extension: { url: 'data:text/html,<script>alert(1)</script>' } }),
    JSON.stringify({ ...baseline, extension: { url: 'https://user:password@example.com/' } }),
    JSON.stringify({ ...baseline, extension: { date: '2026-02-30' } }),
    JSON.stringify({ ...baseline, extension: { date: '2026-1-2' } }),
    JSON.stringify({ ...baseline, extension: [{ id: 'duplicate' }, { id: 'duplicate' }] }),
    JSON.stringify({ ...baseline, extension: { pct: 101 } }),
    ' '.repeat(LIMITS.bytes + 1),
  ];
  for (const input of rejected) {
    f.writeData(input);
    assert.throws(() => updateDashboard({ out: f.out }));
    assert.deepEqual(f.read('dashboard.html'), html);
    assert.deepEqual(f.read('dashboard.html.bak'), backup);
    assert.equal(f.read('data.json').toString(), input);
    assert.equal(fs.existsSync(f.path('.dashboard-update.lock')), false);
  }
  fs.writeFileSync(f.path('data.json'), Buffer.from([0xff, 0xfe]));
  assert.throws(() => updateDashboard({ out: f.out }), /UTF-8/);
  assert.deepEqual(f.read('dashboard.html'), html);
});

test('missing, duplicate, reordered or widened markers and duplicate script ids fail closed', t => {
  const f = fixture(t);
  const baseline = f.read('dashboard.html').toString();
  f.change();
  for (const html of [
    baseline.replace(DATA_START, ''), baseline + DATA_END, baseline.replace(DATA_START, '__SWAP__').replace(DATA_END, DATA_START).replace('__SWAP__', DATA_END),
    baseline.replace(DATA_START, DATA_START + '<p>must preserve</p>'),
    baseline.replace('id="fin-data"', 'id="other-data"'),
    baseline + '<script id="fin-data" type="application/json">{}</script>',
    baseline + '<script type="application/json" id=fin-data>{}</script>',
    baseline + '<script/id=fin-data type=application/json>{}</script>',
    baseline + '<div id="fin&#45;data"></div>',
    baseline.replace('id="fin-data"', 'id="fin-data" id="second"'),
    baseline.replace('id="fin-data" type="application/json"', 'id="fin-data" type="text/javascript"'),
    baseline.replace(THEME_START, ''),
  ]) {
    fs.writeFileSync(f.path('dashboard.html'), html);
    assert.throws(() => updateDashboard({ out: f.out }));
    assert.equal(f.read('dashboard.html').toString(), html);
    assert.equal(fs.existsSync(f.path('dashboard.html.bak')), false);
  }
});

test('metadata profile/schema/provenance mismatches and legacy outputs are rejected', t => {
  const f = fixture(t);
  const initial = f.read('dashboard.html');
  const meta = JSON.parse(f.read('.dashboard-meta.json'));
  for (const edit of [
    { ...meta, profileId: 'seo' }, { ...meta, dataContractVersion: 2 }, { ...meta, scriptId: 'seo-data' },
    { ...meta, generatorVersion: 'unknown' }, { ...meta, template: { version: 1, sha256: '0'.repeat(64) } },
  ]) {
    fs.writeFileSync(f.path('.dashboard-meta.json'), JSON.stringify(edit));
    assert.throws(() => updateDashboard({ out: f.out }));
    assert.deepEqual(f.read('dashboard.html'), initial);
  }
  fs.writeFileSync(f.path('.dashboard-meta.json'), JSON.stringify(meta));
  assert.throws(() => updateDashboard({ out: f.out, profileId: 'pets' }), /profile/);
  fs.unlinkSync(f.path('.dashboard-meta.json'));
  assert.throws(() => updateDashboard({ out: f.out }), /Missing .dashboard-meta.json/);
});

test('existing output and --force never scaffold over local data', t => {
  const f = fixture(t);
  const bytes = f.read('data.json');
  assert.throws(() => scaffoldDashboard({ profileId: 'seo', out: f.out }), /already exists/);
  const run = spawnSync(process.execPath, [join(ROOT, 'scripts/build-dashboard.mjs'), '--profile', 'seo', '--out', f.out, '--force'], { encoding: 'utf8', windowsHide: true });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /never overwrites/);
  assert.deepEqual(f.read('data.json'), bytes);
});

test('profile traversal and every tracked source root are rejected before writes', () => {
  for (const id of ['../seo', '..\\seo', '/seo', 'seo/../../docs', 'SEO']) assert.throws(() => loadProfile(id), /Invalid profile id/);
  for (const path of ['', 'profiles/seo', 'themes/new', 'scripts/new', 'docs/new', '.git/objects', 'tests/new', 'Plans/new']) {
    assert.throws(() => assertOutputRoot(resolve(ROOT, path), ROOT, { mustExist: false }), /protected/);
  }
  assert.throws(() => outputFile(ROOT, '../outside.html', { optional: true }), /Unsafe/);
});

test('junction output and symlink/hardlink inputs cannot escape the selected folder', t => {
  const f = fixture(t);
  const alias = join(f.scratch, 'alias');
  try { fs.symlinkSync(f.out, alias, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) { t.skip('Symlink creation is unavailable on this host'); return; } throw error; }
  try { assert.throws(() => updateDashboard({ out: alias }), /link|junction/i); }
  finally { fs.unlinkSync(alias); }
  const outside = join(f.scratch, 'outside-data.json');
  fs.copyFileSync(f.path('data.json'), outside);
  fs.unlinkSync(f.path('data.json'));
  fs.linkSync(outside, f.path('data.json'));
  assert.throws(() => updateDashboard({ out: f.out }), /singly linked/);
  fs.unlinkSync(f.path('data.json'));
  fs.copyFileSync(outside, f.path('data.json'));
  // A backup hardlink is as dangerous as an input alias, even on an otherwise no-op update.
  fs.linkSync(outside, f.path('dashboard.html.bak'));
  assert.throws(() => updateDashboard({ out: f.out }), /singly linked/);
});

for (const existingBackup of [false, true]) {
  test(`failed HTML publish restores backup state (existing backup: ${existingBackup})`, t => {
    const f = fixture(t);
    if (existingBackup) { f.change('first'); updateDashboard({ out: f.out }); }
    const before = f.read('dashboard.html');
    const backup = existingBackup ? f.read('dashboard.html.bak') : null;
    f.change('second');
    const io = { ...fs, renameSync(from, to) {
      if (to === f.path('dashboard.html')) throw Object.assign(new Error('injected rename failure'), { code: 'EACCES' });
      return fs.renameSync(from, to);
    } };
    assert.throws(() => updateDashboard({ out: f.out, io }), /last good HTML is unchanged/);
    assert.deepEqual(f.read('dashboard.html'), before);
    if (backup) assert.deepEqual(f.read('dashboard.html.bak'), backup);
    else assert.equal(fs.existsSync(f.path('dashboard.html.bak')), false);
    assert.deepEqual(fs.readdirSync(f.out).filter(name => /\.tmp|\.lock/.test(name)), []);
    assert.equal(updateDashboard({ out: f.out }).changed, true);
  });
}

test('failed staging write does not touch HTML or backup and leaves no temporary file', t => {
  const f = fixture(t);
  f.change();
  const before = f.read('dashboard.html');
  const io = { ...fs, writeFileSync() { throw new Error('injected disk full'); } };
  assert.throws(() => updateDashboard({ out: f.out, io }), /disk full/);
  assert.deepEqual(f.read('dashboard.html'), before);
  assert.equal(fs.existsSync(f.path('dashboard.html.bak')), false);
  assert.deepEqual(fs.readdirSync(f.out).filter(name => /\.tmp|\.lock/.test(name)), []);
});

test('concurrent updater lock fails without modifying it or other files', t => {
  const f = fixture(t);
  fs.writeFileSync(f.path('.dashboard-update.lock'), 'another owner');
  assert.throws(() => updateDashboard({ out: f.out }), /Another update/);
  assert.equal(f.read('.dashboard-update.lock').toString(), 'another owner');
});

test('shared validator rejects non-JSON objects without evaluating accessors', () => {
  const profile = loadProfile('seo');
  let ran = false;
  const value = structuredClone(profile.example);
  Object.defineProperty(value, 'injected', { enumerable: true, get() { ran = true; return 'oops'; } });
  assert.throws(() => validateData(value, profile), /accessors/);
  assert.equal(ran, false);
  const circular = structuredClone(profile.example);
  circular.extension = circular;
  assert.throws(() => validateData(circular, profile), /acyclic/);
  const sparse = structuredClone(profile.example);
  sparse.extension = new Array(LIMITS.collection + 1);
  assert.throws(() => validateData(sparse, profile), /bounded, dense/);
});

test('script replacement accepts legitimate attribute order and preserves its formatting', () => {
  const original = DATA_START + '\r\n<script TYPE=application/json id=demo-data >{}</script>\r\n' + DATA_END;
  const next = replaceEmbeddedData(original, 'demo-data', { text: '$& </script>' });
  assert.ok(next.startsWith(DATA_START + '\r\n<script TYPE=application/json id=demo-data >'));
  assert.ok(next.endsWith('</script>\r\n' + DATA_END));
  assert.equal(next.includes('$&'), false); // Ampersands are escaped, replacement tokens stay literal after JSON.parse.
  assert.ok(next.includes('$\\u0026'));
});

test('CLI performs real updates and gives nonzero useful failures', t => {
  const f = fixture(t, 'seo');
  f.change('CLI update');
  const run = (...args) => spawnSync(process.execPath, [join(ROOT, 'scripts/update-dashboard.mjs'), '--out', f.out, ...args], { encoding: 'utf8', windowsHide: true });
  assert.equal(run().status, 0);
  assert.match(run().stdout, /Already up to date/);
  const mismatch = run('--profile', 'pets');
  assert.equal(mismatch.status, 1);
  assert.match(mismatch.stderr, /does not match/);
  assert.equal(run('--force').status, 1);
});
