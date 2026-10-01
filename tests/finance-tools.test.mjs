import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, scaffoldDashboard, embeddedData } from '../scripts/lib/dashboard-core.mjs';
import {
  appendHistoryEntry, assertHistoryPreserved, applyActionPlan, appendHistory, syncActionPlan,
} from '../scripts/lib/finance-tools.mjs';

const example = JSON.parse(fs.readFileSync(join(ROOT, 'profiles/finances/example-data.json'), 'utf8'));

function dashboard(t) {
  const scratch = fs.mkdtempSync(join(tmpdir(), 'dashboard-finance-test-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const out = join(scratch, 'generated');
  scaffoldDashboard({ profileId: 'finances', out });
  const data = () => JSON.parse(fs.readFileSync(join(out, 'data.json'), 'utf8'));
  const shown = () => embeddedData(fs.readFileSync(join(out, 'dashboard.html'), 'utf8'), 'fin-data');
  return { out, data, shown };
}

test('history append adds one entry at the end and leaves every existing entry untouched', () => {
  const before = structuredClone(example);
  const { data, entry } = appendHistoryEntry(example, { date: '2026-06-23', type: 'payment', label: '  Rent — June ', amount: 1400, source: 'bills' });
  assert.deepEqual(example, before, 'input is not mutated');
  assert.equal(data.history.length, example.history.length + 1);
  assert.deepEqual(data.history.slice(0, -1), example.history);
  assert.deepEqual(entry, { id: 'h-2026-06-23-1', date: '2026-06-23', type: 'payment', label: 'Rent — June', amount: 1400, source: 'bills' });
  assert.deepEqual(data.history.at(-1), entry);
  const second = appendHistoryEntry(data, { date: '2026-06-23', type: 'todo-done', label: 'Second same day', source: 'todos', note: 'n' });
  assert.equal(second.entry.id, 'h-2026-06-23-2');
  assert.equal(second.entry.amount, null);
  const legacy = structuredClone(example); delete legacy.history;
  assert.equal(appendHistoryEntry(legacy, { date: '2026-01-01', type: 'payment', label: 'First', source: 'bills' }).data.history.length, 1);
});

test('history append rejects invalid entries', () => {
  const ok = { date: '2026-06-23', type: 'payment', label: 'x', source: 'bills' };
  for (const [patch, message] of [
    [{ date: '2026-02-30' }, /calendar date/], [{ date: '06/23/2026' }, /calendar date/], [{ type: 'refund' }, /type/],
    [{ source: 'bank' }, /source/], [{ label: '   ' }, /label/], [{ amount: -5 }, /amount/], [{ amount: Number.NaN }, /amount/],
  ]) assert.throws(() => appendHistoryEntry(example, { ...ok, ...patch }), message);
});

test('history guard detects removed or edited published entries', () => {
  const current = structuredClone(example);
  assert.doesNotThrow(() => assertHistoryPreserved(example, current));
  assert.doesNotThrow(() => assertHistoryPreserved(example, appendHistoryEntry(current, { date: '2026-06-30', type: 'payment', label: 'x', source: 'bills' }).data));
  const edited = structuredClone(example); edited.history[0].amount = 1;
  assert.throws(() => assertHistoryPreserved(example, edited), /append-only[\s\S]*h-2026-04-15-1/);
  const removed = structuredClone(example); removed.history.pop();
  assert.throws(() => assertHistoryPreserved(example, removed), /h-2026-06-15-1/);
});

test('fin:history appends through the validated save path and refreshes the embedded dashboard', t => {
  const f = dashboard(t);
  const result = appendHistory({ out: f.out, date: '2026-06-23', type: 'payment', label: 'Rent — June', amount: 1400, source: 'bills' });
  assert.equal(result.entry.id, 'h-2026-06-23-1');
  assert.deepEqual(f.data().history.at(-1), result.entry);
  assert.deepEqual(f.shown().history.at(-1), result.entry, 'dashboard.html shows the new entry');
  assert.ok(fs.existsSync(join(f.out, 'dashboard.html.bak')));

  const tampered = f.data(); tampered.history.shift();
  fs.writeFileSync(join(f.out, 'data.json'), JSON.stringify(tampered, null, 2));
  assert.throws(() => appendHistory({ out: f.out, date: '2026-06-24', type: 'payment', label: 'x', source: 'bills' }), /append-only/);
  assert.equal(f.shown().history.length, example.history.length + 1, 'refused append leaves the dashboard unchanged');
});

test('fin:history CLI reports usage errors and appends with defaults', t => {
  const f = dashboard(t);
  const run = (...args) => spawnSync(process.execPath, [join(ROOT, 'scripts/fin-history.mjs'), '--out', f.out, ...args], { encoding: 'utf8' });
  const missing = run();
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /--label is required/);
  const ok = run('--label', 'Phone — June', '--amount', '$52', '--date', '2026-06-25');
  assert.equal(ok.status, 0, ok.stderr);
  assert.deepEqual(f.data().history.at(-1), { id: 'h-2026-06-25-1', date: '2026-06-25', type: 'payment', label: 'Phone — June', amount: 52, source: 'bills' });
});

test('fin:action-plan --init writes ACTION-PLAN.md once, and sync embeds edits as the checklist source', t => {
  const f = dashboard(t);
  const init = syncActionPlan({ out: f.out, init: true });
  assert.equal(init.created, true);
  const file = join(f.out, 'ACTION-PLAN.md');
  assert.equal(fs.readFileSync(file, 'utf8'), example.actionPlan.markdown);
  assert.throws(() => syncActionPlan({ out: f.out, init: true }), /not overwritten/);
  fs.writeFileSync(file, '﻿# Plan\r\n\r\n## Next\r\n- [ ] Call the landlord\r\n');
  const synced = syncActionPlan({ out: f.out });
  assert.equal(synced.changed, true);
  assert.deepEqual(f.data().actionPlan, { source: 'ACTION-PLAN.md', markdown: '# Plan\n\n## Next\n- [ ] Call the landlord\n' });
  assert.deepEqual(f.shown().actionPlan, f.data().actionPlan);
  assert.equal(syncActionPlan({ out: f.out }).changed, false);
  for (const bad of ['../ACTION-PLAN.md', 'plan.txt', 'sub/plan.md']) assert.throws(() => syncActionPlan({ out: f.out, file: bad }), /plain \.md file/);
  assert.throws(() => syncActionPlan({ out: f.out, file: 'MISSING.md' }), /not found/);
  assert.throws(() => applyActionPlan(example, 'x'.repeat(70000)), /at most/);
});
