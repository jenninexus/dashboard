/** Finance-profile helpers: the append-only payment history and the ACTION-PLAN.md checklist sync. */
import * as fs from 'node:fs';
import { readDashboard, saveDashboard, embeddedData, LIMITS } from './dashboard-core.mjs';
import { outputFile } from './dashboard-paths.mjs';

export const HISTORY_TYPES = Object.freeze(['payment', 'todo-done', 'deadline-cleared', 'deadline-passed']);
export const HISTORY_SOURCES = Object.freeze(['bills', 'deadlines', 'todos', 'action-plan']);
const fail = message => { throw new Error(message); };

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}

/**
 * Returns a copy of data with one entry appended to history[]. Existing entries are never
 * reordered, edited or removed; a correction is itself a new entry.
 */
export function appendHistoryEntry(data, { date, type, label, amount = null, source, note } = {}) {
  if (!isCalendarDate(date)) fail('History date must be a real YYYY-MM-DD calendar date');
  if (!HISTORY_TYPES.includes(type)) fail(`History type must be one of: ${HISTORY_TYPES.join(', ')}`);
  if (!HISTORY_SOURCES.includes(source)) fail(`History source must be one of: ${HISTORY_SOURCES.join(', ')}`);
  if (typeof label !== 'string' || !label.trim() || label.length > 4000) fail('History label is required (at most 4000 characters)');
  if (amount !== null && (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 1e9)) fail('History amount must be a non-negative number or omitted');
  if (note !== undefined && (typeof note !== 'string' || note.length > 4000)) fail('History note must be text (at most 4000 characters)');
  const next = structuredClone(data);
  if (next.history === undefined) next.history = [];
  if (!Array.isArray(next.history)) fail('data.history must be an array');
  const ids = new Set(next.history.map(row => row?.id));
  let n = 1;
  while (ids.has(`h-${date}-${n}`)) n++;
  const entry = { id: `h-${date}-${n}`, date, type, label: label.trim(), amount, source };
  if (note) entry.note = note;
  next.history.push(entry);
  return { data: next, entry };
}

/** Every entry already published in dashboard.html must still be present, unchanged, in data.json. */
export function assertHistoryPreserved(previous, current) {
  const now = new Map((current?.history || []).map(row => [row?.id, JSON.stringify(row)]));
  const lost = (previous?.history || []).filter(row => now.get(row?.id) !== JSON.stringify(row)).map(row => row?.id);
  if (lost.length) fail(`History is append-only, but data.json removed or changed: ${lost.join(', ')}. Restore those entries (dashboard.html.bak or the wizard's backup export has them) and append corrections instead.`);
}

export function applyActionPlan(data, markdown, source = 'ACTION-PLAN.md') {
  if (typeof markdown !== 'string' || markdown.length > LIMITS.string) fail(`Action plan must be text of at most ${LIMITS.string} characters`);
  if (typeof source !== 'string' || !source || source.length > 200) fail('Action plan source name is invalid');
  return { ...structuredClone(data), actionPlan: { source, markdown: markdown.replace(/\r\n?/g, '\n') } };
}

function save(out, state, next) {
  return saveDashboard({ out, source: JSON.stringify(next, null, 2) + '\n', expectedRevision: state.revision });
}

const financeState = out => readDashboard({ out, profileId: 'finances' });

export function appendHistory({ out = 'my-dashboard', ...entry }) {
  const state = financeState(out);
  assertHistoryPreserved(embeddedData(state.html, state.meta.scriptId), state.data);
  const result = appendHistoryEntry(state.data, entry);
  save(out, state, result.data);
  return { entry: result.entry, dataPath: state.dataPath, htmlPath: state.htmlPath };
}

/** Plain file name inside the dashboard folder, so the plan travels with its data.json. */
export function syncActionPlan({ out = 'my-dashboard', file = 'ACTION-PLAN.md', init = false } = {}) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.md$/.test(file)) fail('Action plan file must be a plain .md file name inside the dashboard folder');
  const state = financeState(out);
  const path = outputFile(state.output, file, { optional: true });
  if (init) {
    if (fs.existsSync(path)) fail(`${file} already exists; it was not overwritten`);
    const markdown = state.data.actionPlan?.markdown ?? '# Action Plan\n\n## This Week\n- [ ] First task\n';
    fs.writeFileSync(path, markdown, { flag: 'wx', mode: 0o600 });
    return { created: true, path, changed: false };
  }
  if (!fs.existsSync(path)) fail(`${file} not found in ${state.output}; run with --init to create it from the current data`);
  const bytes = fs.readFileSync(outputFile(state.output, file));
  if (bytes.length > LIMITS.string * 4) fail(`${file} is too large`);
  const markdown = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  const next = applyActionPlan(state.data, markdown, file);
  const result = save(out, state, next);
  return { created: false, path, changed: result.changed };
}
