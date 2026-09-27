import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { request as httpRequest } from 'node:http';
import { createServer as netServer } from 'node:net';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { startWizard } from '../scripts/wizard/server.mjs';
import { ROOT, loadProfile, scaffoldDashboard, readDashboard, saveDashboard, validateData, loadThemes, assertOutputRoot, scopeThemeRoots } from '../scripts/lib/dashboard-core.mjs';
import { validateEditorSchema } from '../scripts/lib/editor-schema.mjs';

async function fixture(t, options = {}) {
  const scratch = fs.mkdtempSync(join(tmpdir(), 'dashboard-wizard-test-'));
  const out = join(scratch, 'generated');
  const wizard = await startWizard({ out, ...options });
  let selectionId;
  t.after(async () => { await wizard.stop(); fs.rmSync(scratch, { recursive: true, force: true }); });
  const request = async (route, body, extra = {}) => {
    const response = await fetch(wizard.origin + route, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'X-Dashboard-Token': wizard.token, Origin: wizard.origin, ...(selectionId ? { 'X-Dashboard-Selection': selectionId } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra.headers },
      ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }), ...extra,
    });
    const text = await response.text();
    let result; try { result = JSON.parse(text); } catch { result = text; }
    if (response.ok && result?.selectionId) selectionId = result.selectionId;
    else if (response.ok && result?.state?.selectionId) selectionId = result.state.selectionId;
    return { status: response.status, result, headers: response.headers };
  };
  const post = async (route, data) => { const response = await request('/api/' + route, data); assert.ok(response.status < 300, JSON.stringify(response)); return response.result; };
  return { scratch, out, wizard, request, post };
}

function raw(wizard, { path = '/api/select', method = 'POST', body = '{}', headers = {} } = {}) {
  return new Promise((done, reject) => {
    const req = httpRequest(wizard.origin, { path, method, headers: { Host: wizard.origin.slice(7), Origin: wizard.origin, 'X-Dashboard-Token': wizard.token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers } }, response => {
      const chunks = []; response.on('data', chunk => chunks.push(chunk)); response.on('end', () => done({ status: response.statusCode, text: Buffer.concat(chunks).toString(), headers: response.headers }));
    });
    req.on('error', reject); req.end(body);
  });
}

for (const profileId of ['seo', 'finances', 'health', 'pets']) test(`${profileId}: first run, edit, import/export, preview, restore and returning flow`, async t => {
  const f = await fixture(t);
  const catalog = await f.request('/api/catalog');
  assert.equal(catalog.status, 200);
  assert.equal(catalog.result.profiles.length, 4);
  assert.equal(catalog.result.themes.length, 7);
  const selection = await f.post('select', { path: f.out });
  assert.equal(selection.exists, false);
  let current = await f.post('scaffold', { profileId, themeId: 'midnight-blue', name: 'Fictional local editor test' });
  assert.equal(current.themeId, 'midnight-blue');
  const originalHtml = fs.readFileSync(join(f.out, 'dashboard.html'));
  const originalSource = current.source;
  const changed = JSON.parse(current.source);
  changed.profile.name = '</script><img src=x onerror=alert(1)> $&';
  changed.futureExtension = { deeply: { preserved: 'unknown value' } };
  const source = JSON.stringify(changed, null, 2);
  assert.equal((await f.post('validate', { source })).valid, true);
  const preview = await f.post('preview', { source });
  const rendered = await f.request(preview.url);
  assert.equal(rendered.status, 200);
  assert.match(rendered.headers.get('content-security-policy'), /sandbox allow-scripts/);
  assert.match(rendered.headers.get('content-security-policy'), /connect-src 'none'/);
  assert.ok(rendered.result.includes('\\u003c/script\\u003e'));
  assert.deepEqual(fs.readFileSync(join(f.out, 'dashboard.html')), originalHtml);
  current = await f.post('save', { source, revision: current.revision });
  assert.equal(current.changed, true);
  assert.equal(current.hasBackup, true);
  assert.deepEqual(current.data.futureExtension, changed.futureExtension);
  assert.equal(fs.readFileSync(join(f.out, 'data.json'), 'utf8'), source);
  assert.deepEqual(fs.readFileSync(join(f.out, 'dashboard.html.bak')), originalHtml);
  const exported = await f.request('/api/export');
  assert.equal(exported.status, 200);
  assert.equal(exported.headers.get('content-disposition'), 'attachment; filename="data.json"');
  assert.deepEqual(exported.result, changed);
  const noop = await f.post('save', { source, revision: current.revision });
  assert.equal(noop.changed, false);
  current = await f.post('restore', { revision: current.revision });
  assert.deepEqual(current.data, JSON.parse(originalSource));
  const reopened = await f.post('select', { path: f.out });
  assert.equal(reopened.exists, true);
  assert.equal(reopened.state.profileId, profileId);
  const overwrite = await f.request('/api/scaffold', { profileId });
  assert.equal(overwrite.status, 400);
  assert.match(overwrite.result.error, /already exists/);
});

test('token, Host, Origin, method, content type and route guards reject unauthorized mutations', async t => {
  const f = await fixture(t);
  const cases = [
    { headers: { 'X-Dashboard-Token': '' }, status: 403 },
    { headers: { 'X-Dashboard-Token': 'a'.repeat(64) }, status: 403 },
    { headers: { Host: 'evil.example' }, status: 403 },
    { headers: { Origin: 'https://evil.example' }, status: 403 },
    { headers: { Origin: '' }, status: 403 },
    { headers: { Origin: 'null' }, status: 403 },
    { headers: { 'Sec-Fetch-Site': 'cross-site' }, status: 403 },
    { headers: { 'Content-Type': 'text/plain' }, status: 415 },
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, status: 415 },
    { method: 'GET', status: 405 }, { method: 'OPTIONS', status: 405 }, { method: 'PUT', status: 405 },
    { path: '/api/select?path=anything', status: 404 }, { path: '/api/%73elect', status: 404 },
    { path: '/../../package.json', status: 404 }, { path: '/api/unknown', status: 404 },
    { body: '{"path":"one","path":"two"}', status: 400 },
    { body: '{"__proto__":{}}', status: 400 }, { body: '{"path":"a","force":true}', status: 400 },
  ];
  for (const { status, ...options } of cases) {
    const result = await raw(f.wizard, options);
    assert.equal(result.status, status, JSON.stringify({ options, result }));
  }
  assert.equal(fs.existsSync(f.out), false);
  const shell = await raw(f.wizard, { path: '/', method: 'GET', body: '', headers: { 'X-Dashboard-Token': '' } });
  assert.equal(shell.status, 200);
  assert.equal(shell.text.includes(f.wizard.token), false);
  assert.match(shell.headers['content-security-policy'], /frame-ancestors 'none'/);
  const leaked = await raw(f.wizard, { path: '/api/catalog', method: 'GET', body: '', headers: { 'X-Dashboard-Token': '' } });
  assert.equal(leaked.status, 403);
});

test('oversized requests fail before changing the selected output', async t => {
  const f = await fixture(t, { maximumBody: 256 });
  const response = await raw(f.wizard, { body: JSON.stringify({ path: 'x'.repeat(500) }) });
  assert.equal(response.status, 413);
  assert.equal(fs.existsSync(f.out), false);
});

test('selected output bounds, protected roots, symlinks and unsupported theme choices fail closed', async t => {
  const f = await fixture(t);
  for (const folder of ['profiles/finances', 'themes', 'scripts', 'docs', 'configs', '.git', 'tests', 'Plans', '.', 'personal-finance', 'my-dashboard-copy', 'my-dashboard/nested', 'my-dashboard/../personal-finance']) {
    const result = await f.request('/api/select', { path: join(ROOT, folder) });
    assert.equal(result.status, 400, folder);
    assert.match(result.result.error, /protected/);
  }
  await f.post('select', { path: f.out });
  const crossTheme = await f.request('/api/scaffold', { profileId: 'finances', themeId: 'dusk-companion' });
  assert.equal(crossTheme.status, 400);
  assert.equal(fs.existsSync(f.out), false);
  const state = await f.post('scaffold', { profileId: 'finances' });
  const escaped = await f.request('/api/save', { source: state.source, revision: state.revision, out: join(f.scratch, 'escape') });
  assert.equal(escaped.status, 400);
  assert.equal(fs.existsSync(join(f.scratch, 'escape')), false);
  const alias = join(f.scratch, 'alias');
  try { fs.symlinkSync(f.out, alias, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (failure) { if (['EPERM', 'EACCES'].includes(failure.code)) return; throw failure; }
  try { assert.equal((await f.request('/api/select', { path: alias })).status, 400); }
  finally { fs.unlinkSync(alias); }
  assert.equal((await f.request('/api/state')).result.output, f.out);
});

test('only canonical my-dashboard may live inside the repository; external custom folders remain allowed', t => {
  const scratch = fs.mkdtempSync(join(tmpdir(), 'dashboard-output-boundary-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  assert.equal(assertOutputRoot(join(ROOT, 'my-dashboard'), ROOT, { mustExist: false }), join(ROOT, 'my-dashboard'));
  assert.match(fs.readFileSync(join(ROOT, '.gitignore'), 'utf8'), /^my-dashboard\/$/m);
  for (const name of ['personal-finance', 'my-dashboard-new', 'my-dashboard/subfolder', '_private/output', 'storage/output']) {
    assert.throws(() => assertOutputRoot(join(ROOT, name), ROOT, { mustExist: false }), /outside the repository/);
  }
  const output = join(scratch, 'personal-finance');
  assert.equal(assertOutputRoot(output, ROOT, { mustExist: false }), output);
  scaffoldDashboard({ profileId: 'finances', out: output });
  assert.equal(readDashboard({ out: output }).profile.id, 'finances');
});

async function beginPartial(wizard, route, body, selectionId) {
  const bytes = Buffer.from(JSON.stringify(body));
  // Observe the server receiving the first byte; no timing guess or sleep hides the race.
  const arrived = new Promise(done => {
    const listener = request => {
      if (request.url !== `/api/${route}`) return;
      wizard.server.off('request', listener);
      request.once('data', done);
    };
    wizard.server.on('request', listener);
  });
  let request;
  const response = new Promise((done, reject) => {
    request = httpRequest(wizard.origin, { path: `/api/${route}`, method: 'POST', headers: {
      Origin: wizard.origin, 'X-Dashboard-Token': wizard.token, 'X-Dashboard-Selection': selectionId,
      'Content-Type': 'application/json', 'Content-Length': bytes.length,
    } }, result => {
      const chunks = []; result.on('data', chunk => chunks.push(chunk));
      result.on('end', () => done({ status: result.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    request.on('error', reject);
    request.write(bytes.subarray(0, 1));
  });
  await arrived;
  return () => { request.end(bytes.subarray(1)); return response; };
}

test('slow-body save/update/restore/preview/validate reject a folder switch, even with identical data revisions', { timeout: 10000 }, async t => {
  const f = await fixture(t);
  const a = f.out, b = join(f.scratch, 'other');
  for (const out of [a, b]) {
    scaffoldDashboard({ profileId: 'finances', out });
    const state = readDashboard({ out });
    const data = structuredClone(state.data); data.profile.name = 'Same saved bytes';
    saveDashboard({ out, source: JSON.stringify(data), expectedRevision: state.revision });
  }
  const aState = readDashboard({ out: a }), bState = readDashboard({ out: b });
  assert.equal(aState.revision, bState.revision, 'identical bytes reproduce the original cross-folder revision collision');
  const files = ['data.json', 'dashboard.html', 'dashboard.html.bak', '.dashboard-meta.json'];
  const snapshots = new Map([a, b].map(out => [out, files.map(file => fs.readFileSync(join(out, file)))]));
  const draft = structuredClone(aState.data); draft.profile.name = 'Private draft intended only for A';
  for (const route of ['save', 'restore', 'update', 'preview', 'validate']) {
    const selected = await f.post('select', { path: a });
    const body = route === 'save' ? { source: JSON.stringify(draft), revision: aState.revision } :
      route === 'restore' ? { revision: aState.revision } : route === 'update' ? {} : { source: JSON.stringify(draft) };
    const finish = await beginPartial(f.wizard, route, body, selected.selectionId);
    await f.post('select', { path: b });
    const result = await finish();
    assert.equal(result.status, 409, route);
    assert.match(result.body.error, /selection changed while/);
    for (const out of [a, b]) assert.deepEqual(files.map(file => fs.readFileSync(join(out, file))), snapshots.get(out), `${route} must not change ${out}`);
  }
  // A stale tab starting after the switch must fail too, without waiting for body parsing.
  const selectedA = await f.post('select', { path: a });
  await f.post('select', { path: b });
  const stale = await raw(f.wizard, { path: '/api/save', body: JSON.stringify({ source: JSON.stringify(draft), revision: aState.revision }), headers: { 'X-Dashboard-Selection': selectedA.selectionId } });
  assert.equal(stale.status, 409);
});

test('slow-body scaffold and selection requests cannot change a subsequently selected folder', { timeout: 10000 }, async t => {
  const f = await fixture(t);
  const other = join(f.scratch, 'other'), third = join(f.scratch, 'third');
  const first = await f.post('select', { path: f.out });
  const finishScaffold = await beginPartial(f.wizard, 'scaffold', { profileId: 'finances' }, first.selectionId);
  await f.post('select', { path: other });
  assert.equal((await finishScaffold()).status, 409);
  assert.equal(fs.existsSync(f.out), false); assert.equal(fs.existsSync(other), false);
  const second = await f.post('select', { path: f.out });
  const finishSelection = await beginPartial(f.wizard, 'select', { path: third }, second.selectionId);
  await f.post('select', { path: other });
  assert.equal((await finishSelection()).status, 409);
  const create = await f.post('scaffold', { profileId: 'pets' });
  assert.equal(create.output, other);
  assert.equal(fs.existsSync(third), false);
});

test('selection generation rejects an A-to-B-to-A race', { timeout: 10000 }, async t => {
  const f = await fixture(t);
  const first = await f.post('select', { path: f.out });
  const finish = await beginPartial(f.wizard, 'scaffold', { profileId: 'seo' }, first.selectionId);
  await f.post('select', { path: join(f.scratch, 'other') });
  const again = await f.post('select', { path: f.out });
  assert.notEqual(first.selectionId, again.selectionId);
  assert.equal((await finish()).status, 409);
  assert.equal(fs.existsSync(f.out), false);
});

test('generated default and alternate themes cannot override profile light mode with dark root tokens', t => {
  const scratch = fs.mkdtempSync(join(tmpdir(), 'dashboard-theme-light-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  for (const theme of loadThemes()) for (const profileId of theme.compatibleProfiles) {
    const out = join(scratch, `${profileId}-${theme.id}`);
    scaffoldDashboard({ profileId, themeId: theme.id, out });
    const html = fs.readFileSync(join(out, 'dashboard.html'), 'utf8');
    const generated = /<style id="dashboard-theme">([\s\S]*?)<\/style>/.exec(html)[1];
    assert.match(generated, /:root:not\(\[data-theme="light"\]\)/, `${profileId}/${theme.id}`);
    assert.doesNotMatch(generated, /:root\s*\{/, `${profileId}/${theme.id}: no later unconditional root may defeat the earlier light selector`);
    assert.match(html.slice(0, html.indexOf('<style id="dashboard-theme">')), /\[data-theme="light"\]\s*\{[^}]*--bg\s*:/);
    // An explicit light block supplied by a theme is preserved; other themes inherit the profile's light palette.
    const light = theme.css.match(/\[data-theme="light"\]\s*\{[^}]*\}/)?.[0];
    if (light) assert.ok(generated.includes(light));
  }
  const css = '/* :root { prose } */ :root { --label: ":root"; --bg: #000; }';
  assert.equal(scopeThemeRoots(css), '/* :root { prose } */ :root:not([data-theme="light"]) { --label: ":root"; --bg: #000; }');
  assert.throws(() => scopeThemeRoots(':root, .other { --bg:#000; }'), /Unsupported public theme/);
});

test('simultaneous launch tokens, ports and selections are isolated', async t => {
  const a = await fixture(t), b = await fixture(t);
  assert.notEqual(a.wizard.port, b.wizard.port);
  assert.notEqual(a.wizard.token, b.wizard.token);
  assert.match(a.wizard.token, /^[a-f0-9]{64}$/);
  assert.equal(a.wizard.server.address().address, '127.0.0.1');
  assert.equal((await raw(b.wizard, { headers: { 'X-Dashboard-Token': a.wizard.token } })).status, 403);
  await a.post('select', { path: a.out });
  await a.post('scaffold', { profileId: 'pets' });
  assert.equal((await b.request('/api/state')).status, 409);
  await assert.rejects(startWizard({ out: b.out, port: a.wizard.port }), /EADDRINUSE/);
  assert.equal((await a.request('/api/ping')).status, 200);
});

async function portCanBeRebound(port) {
  const server = netServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', done); });
  await new Promise(done => server.close(done));
}

test('explicit Stop releases the port and cancels idle state', async t => {
  const f = await fixture(t);
  const response = await f.post('stop', {});
  assert.equal(response.stopped, true);
  await f.wizard.closed;
  await portCanBeRebound(f.wizard.port);
});

test('idle shutdown releases the port; authenticated activity extends the lease', async t => {
  const f = await fixture(t, { idleMs: 160 });
  for (let count = 0; count < 4; count++) {
    await new Promise(done => setTimeout(done, 65));
    assert.equal((await f.request('/api/ping')).status, 200);
  }
  await f.wizard.closed;
  await portCanBeRebound(f.wizard.port);
});

test('revision guard prevents lost external edits; bad JSON can be repaired through the editor', async t => {
  const f = await fixture(t);
  await f.post('select', { path: f.out });
  let state = await f.post('scaffold', { profileId: 'finances' });
  const external = JSON.parse(state.source); external.profile.name = 'External change';
  fs.writeFileSync(join(f.out, 'data.json'), JSON.stringify(external));
  const stale = await f.request('/api/save', { source: state.source, revision: state.revision });
  assert.equal(stale.status, 400); assert.match(stale.result.error, /changed since/);
  assert.deepEqual(JSON.parse(fs.readFileSync(join(f.out, 'data.json'))), external);
  const updated = await f.post('update', {});
  assert.equal(updated.changed, true);
  fs.writeFileSync(join(f.out, 'data.json'), '{bad json');
  const broken = (await f.request('/api/state')).result;
  assert.equal(broken.data, null); assert.match(broken.validationError, /data.json/);
  state = await f.post('save', { source: JSON.stringify(external), revision: broken.revision });
  assert.equal(state.data.profile.name, 'External change');
});

test('editor transaction rolls JSON and backup back when HTML cannot publish', t => {
  const scratch = fs.mkdtempSync(join(tmpdir(), 'dashboard-wizard-save-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const out = join(scratch, 'generated');
  scaffoldDashboard({ profileId: 'finances', out });
  const state = readDashboard({ out });
  const data = structuredClone(state.data); data.profile.name = 'Failed save';
  const io = { ...fs, renameSync(from, to) { if (to === state.htmlPath) throw new Error('injected HTML publish failure'); return fs.renameSync(from, to); } };
  assert.throws(() => saveDashboard({ out, source: JSON.stringify(data), expectedRevision: state.revision, io }), /unchanged/);
  assert.deepEqual(fs.readFileSync(state.dataPath), state.dataBytes);
  assert.deepEqual(fs.readFileSync(state.htmlPath), state.previous);
  assert.equal(fs.existsSync(join(out, 'dashboard.html.bak')), false);
  assert.deepEqual(fs.readdirSync(out).filter(name => /\.tmp|\.lock/.test(name)), []);
});

test('shared editor contracts enforce required, enums, nullable values, ranges, dates and finance consistency', () => {
  const profile = loadProfile('finances');
  const data = () => structuredClone(profile.example);
  const invalid = [
    value => { delete value.bills[0].amount; }, value => { value.bills[0].status = 'made-up'; },
    value => { value.bills[0].amount = -1; }, value => { value.profile.billCycle = '2026-13'; },
    value => { value.loans[0].targetPayoff = '2026-02-30'; }, value => { value.loans[0].stillOwed += 1; },
    value => { value.bills[1].id = value.bills[0].id; }, value => { value.liquidHoldings = 123; },
  ];
  for (const change of invalid) { const value = data(); change(value); assert.throws(() => validateData(value, profile)); }
  const value = data(); value.profile.monthlyExpenses = null; value.loans[0].targetPayoff = null;
  value.bills[0].id = value.holdings.accounts[0].id; value.extension = { supported: 'preserved' };
  assert.equal(validateData(value, profile), value);
  const numericId = data(); numericId.bills[0].id = '2026-rent';
  assert.equal(validateData(numericId, profile), numericId);
  const malformed = structuredClone(profile.editorSchema); malformed.profile = 'pets';
  assert.throws(() => validateEditorSchema(malformed, 'finances', 1), /profile/);
  const malicious = structuredClone(profile.editorSchema); malicious.sections[0].fields[0].path = '__proto__.name';
  assert.throws(() => validateEditorSchema(malicious, 'finances', 1), /field/);
  const formula = structuredClone(profile.editorSchema); formula.derived[0].formula = 'eval(userInput)';
  assert.throws(() => validateEditorSchema(formula, 'finances', 1), /derivation/);
  assert.equal(loadThemes().length, 7);
});

test('launcher rejects force, invalid port, missing values and supplies readable help without opening a browser', () => {
  const run = (...args) => spawnSync(process.execPath, [join(ROOT, 'scripts/wizard/launch.mjs'), ...args], { encoding: 'utf8', windowsHide: true });
  assert.equal(run('--force').status, 1);
  assert.equal(run('--port', 'no').status, 1);
  assert.equal(run('--out').status, 1);
  assert.match(run('--help').stdout, /npm run dashboard/);
  const cmd = fs.readFileSync(join(ROOT, 'Dashboard.cmd'), 'utf8');
  assert.match(cmd, /%~dp0scripts\\wizard\\launch\.mjs/);
  assert.match(cmd, /Node\.js 18 or newer/);
  const pkg = JSON.parse(fs.readFileSync(join(ROOT, 'package.json')));
  assert.match(pkg.scripts.dashboard, /--open/);
});
