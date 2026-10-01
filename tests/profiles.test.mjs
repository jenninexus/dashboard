import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ids = ['finances', 'seo', 'health', 'pets'];
const read = path => readFileSync(resolve(root, path), 'utf8');
const fixtures = Object.fromEntries(ids.map(id => [id, {
  html: read(`profiles/${id}/${id}.html`),
  data: JSON.parse(read(`profiles/${id}/example-data.json`)),
  schema: JSON.parse(read(`profiles/${id}/editor-schema.json`)),
  manifest: JSON.parse(read(`profiles/${id}/profile.json`))
}]));

function valuesAt(object, path) {
  return path.split('.').reduce((values, segment) => {
    const array = segment.endsWith('[]');
    const key = array ? segment.slice(0, -2) : segment;
    return values.flatMap(value => {
      const next = value?.[key];
      return array ? (Array.isArray(next) ? next : []) : [next];
    });
  }, [object]);
}

function mutateAt(object, path, value) {
  const parts = path.split('.');
  const leaf = parts.pop();
  const parents = parts.length ? valuesAt(object, parts.join('.')) : [object];
  for (const parent of parents) {
    if (!parent) continue;
    if (leaf.endsWith('[]')) parent[leaf.slice(0, -2)] = parent[leaf.slice(0, -2)].map(() => value);
    else parent[leaf] = value;
  }
}

// Executes the real embedded scripts against a small DOM recorder. This is a
// sink/logic check; a real browser still owns layout, accessibility and offline QA.
function render(id, data = fixtures[id].data, options = {}) {
  const nodes = new Map();
  const all = [];
  const storage = new Map(Object.entries(options.seed ?? {}));
  const storageReads = [];
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase(); this.style = {}; this.dataset = {};
      this.children = []; this.attributes = {}; this.events = {}; this.textContent = ''; this.innerHTML = '';
      const classes = new Set();
      this.classList = {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name),
        toggle: (name, force) => {
          const on = force ?? !classes.has(name);
          if (on) classes.add(name); else classes.delete(name);
          return on;
        }
      };
      all.push(this);
    }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    removeAttribute(key) { delete this.attributes[key]; }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
    addEventListener(type, fn) { this.events[type] = fn; }
    closest() { return this; }
  }
  const node = key => { if (!nodes.has(key)) nodes.set(key, new Element()); return nodes.get(key); };
  node(fixtures[id].manifest.dataInjection.scriptId).textContent = JSON.stringify(data);
  const document = {
    readyState: 'complete', documentElement: new Element('html'),
    getElementById: node, querySelector: node, querySelectorAll: () => [],
    createElement: tag => new Element(tag), createElementNS: (_, tag) => new Element(tag),
    createTextNode: text => { const element = new Element('#text'); element.textContent = String(text); return element; },
    addEventListener() {}
  };
  const sandbox = {
    document, console, dashboardToday: options.today === null ? undefined : options.today ?? '2026-06-20',
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    localStorage: {
      getItem(key) {
        storageReads.push(key);
        if (options.storage === 'denied') throw new Error('storage denied');
        return options.storage === 'corrupt' ? '{invalid' : storage.get(key) ?? null;
      },
      setItem(key, value) { if (options.storage === 'denied') throw new Error('storage denied'); storage.set(key, value); }
    }, setTimeout: fn => fn()
  };
  if (options.localDate) sandbox.Date = class extends Date {
    getFullYear() { return options.localDate[0]; }
    getMonth() { return options.localDate[1] - 1; }
    getDate() { return options.localDate[2]; }
    toISOString() { throw new Error('Calendar date must not be converted to UTC'); }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const match of fixtures[id].html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (match[0].includes('type="application/json"')) continue;
    const script = match[1].replace('const derived = deriveFinance(D);', 'const derived = deriveFinance(D); window.testDerived = derived;');
    vm.runInContext(script, sandbox, { timeout: 1000, filename: `${id}.html` });
  }
  return { nodes, all, storage, storageReads, derived: sandbox.testDerived, window: sandbox };
}

for (const id of ids) {
  test(`${id}: inline data equals the versioned fictional fixture`, () => {
    const { html, data, schema, manifest } = fixtures[id];
    const inline = html.match(new RegExp(`<script id="${manifest.dataInjection.scriptId}" type="application/json">([\\s\\S]*?)<\\/script>`));
    assert.ok(inline);
    assert.deepEqual(JSON.parse(inline[1]), data);
    assert.equal(schema.version, data.schemaVersion);
    assert.equal(schema.version, manifest.dataContractVersion);
    assert.equal(schema.profile, id);
    assert.equal(schema.unknownFields, 'preserve');
  });

  test(`${id}: example fields satisfy their compact editor contract`, () => {
    const { data, schema } = fixtures[id];
    for (const field of schema.sections.flatMap(section => section.fields)) {
      for (const value of valuesAt(data, field.path)) {
        if (value === undefined && !field.required || value === null && field.nullable) continue;
        assert.notEqual(value, undefined, field.path);
        if (field.type === 'enum') assert.ok(field.values.includes(value), `${field.path}: ${value}`);
        else if (field.type === 'date') {
          assert.match(value, /^\d{4}-\d{2}-\d{2}$/, field.path);
          assert.equal(new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10), value, field.path);
        } else assert.equal(typeof value, field.type, field.path);
        if (field.min != null) assert.ok(value >= field.min, field.path);
        if (field.max != null) assert.ok(value <= field.max, field.path);
        if (field.maxLength) assert.ok(value.length <= field.maxLength, field.path);
        if (field.pattern) assert.match(value, new RegExp(field.pattern), field.path);
      }
    }
    for (const collection of schema.collections) {
      for (const array of valuesAt(data, collection.path)) {
        assert.ok(Array.isArray(array), collection.path);
        assert.ok(array.length >= collection.minItems && array.length <= collection.maxItems, collection.path);
        if (collection.identity) assert.equal(new Set(array.map(item => item[collection.identity])).size, array.length, collection.path);
      }
    }
  });

  test(`${id}: renderer executes with corrupt or unavailable local storage`, () => {
    render(id); render(id, undefined, { storage: 'corrupt' }); render(id, undefined, { storage: 'denied' });
  });

  test(`${id}: every text/enum field remains text at HTML sinks`, () => {
    const payload = '\"><img src=x onerror="globalThis.injected=true">$&\u2028</script><script>globalThis.injected=true</script>';
    const fields = fixtures[id].schema.sections.flatMap(section => section.fields).filter(field => ['string','enum'].includes(field.type));
    for (const field of fields) {
      const data = structuredClone(fixtures[id].data);
      mutateAt(data, field.path, payload);
      const result = render(id, data);
      for (const element of result.all) {
        assert.ok(!element.innerHTML.includes('<img src=x'), field.path);
        assert.ok(!element.innerHTML.includes('<script>globalThis'), field.path);
      }
    }
  });

  test(`${id}: offline assets and canonical breakpoints only`, () => {
    const { html } = fixtures[id];
    assert.doesNotMatch(html, /<(?:script|link)\b[^>]*(?:src|href)=["']https?:/i);
    assert.match(html, /unencrypted plaintext/);
    assert.match(html, /not included in JSON backups/);
    for (const match of html.matchAll(/@media\s*\((?:min|max)-width:\s*([\d.]+)px\)/g))
      assert.ok(['389.98','575.98','767.98','991.98'].includes(match[1]), match[0]);
    for (const match of html.matchAll(/<img\b[^>]*src="([^"]+)"/g))
      assert.ok(existsSync(resolve(root, 'profiles', id, match[1])), match[1]);
  });
}

test('finance totals derive from records, and unknowns stay unknown', () => {
  const { derived } = render('finances');
  assert.equal(derived.liquidHoldings, 14685);
  assert.equal(derived.liabilities, 27530);
  assert.equal(derived.billCycleTotal, 2926);
  assert.equal(derived.billsOutstanding, 2486);
  assert.equal(derived.monthlyIncome, 6045);
  assert.equal(derived.savingsRate, 36);
  assert.equal(derived.netWorth, null);
  const data = structuredClone(fixtures.finances.data);
  data.profile.liabilitiesComplete = true;
  assert.equal(render('finances', data).derived.netWorth, -12845);
  data.profile.monthlyExpenses = null;
  assert.equal(render('finances', data).derived.savingsRate, null);
  data.income.forEach(item => { item.status = 'paused'; });
  assert.equal(render('finances', data).derived.monthlyIncome, 0);
  assert.equal(render('finances', data).derived.savingsRate, null);
  for (const loan of data.loans) assert.equal(loan.stillOwed, loan.principal - loan.paidToDate);
});

test('finance due states use the injected calendar date, retaining scheduled autopay uncertainty', () => {
  const onDate = render('finances', undefined, { today: '2026-06-23' }).nodes.get('bills-body').innerHTML;
  const afterDate = render('finances', undefined, { today: '2026-06-24' }).nodes.get('bills-body').innerHTML;
  assert.match(onDate, /Rent[\s\S]*?class="st due">Due/);
  assert.match(afterDate, /Rent[\s\S]*?class="st overdue">Overdue/);
  assert.match(afterDate, /Past date · autopay unconfirmed/);
});

test('pet offline SVG renders every real weight reading and accessible labels', () => {
  const { all } = render('pets');
  const points = all.filter(node => node.tagName === 'CIRCLE');
  const readings = fixtures.pets.data.weight.readings;
  assert.equal(points.length, readings.length);
  readings.forEach((reading, i) => {
    assert.ok(Number.isFinite(Number(points[i].attributes.cy)));
    assert.ok(points[i].attributes['aria-label'].includes(`${reading.date}: ${reading.lbs}`));
  });
  assert.ok(all.some(node => node.tagName === 'POLYLINE' && node.attributes.points.split(' ').length === readings.length));
});

test('calendar clocks use local components and reject impossible injected dates', () => {
  for (const id of ['health', 'pets']) {
    const result = render(id, undefined, { today: null, localDate: [2026, 3, 8] });
    assert.ok(result.storageReads.includes(`${id}-checklist-2026-03-08`));
  }
  const finance = render('finances', undefined, { today: null, localDate: [2026, 11, 1] });
  assert.match(finance.nodes.get('.meta').textContent, /due states today: 2026-11-01/);
  for (const id of ['finances', 'health', 'pets']) {
    assert.throws(() => render(id, undefined, { today: '2026-02-30' }), /real calendar date/);
    assert.throws(() => render(id, undefined, { today: '2026-06-20T00:00:00Z' }), /ISO calendar date/);
    assert.doesNotThrow(() => render(id, undefined, { today: '2028-02-29' }));
  }
});

test('every default theme resolves uniquely to compatible, shipped CSS', () => {
  const manifest = JSON.parse(read('themes/manifest.json'));
  for (const id of ids) {
    const matches = manifest.themes.filter(theme => theme.defaultFor.includes(id));
    assert.equal(matches.length, 1, `${id}: exactly one default theme`);
    assert.equal(matches[0].id, fixtures[id].manifest.theme, id);
    assert.ok(matches[0].compatibleProfiles.includes(id), id);
  }
  for (const entry of [...manifest.themes, ...(manifest.supportingFiles ?? [])]) {
    assert.ok(entry.files.length > 0, entry.id);
    for (const file of entry.files) {
      assert.match(file, /^[a-z0-9.-]+\.css$/i, entry.id);
      assert.ok(existsSync(resolve(root, 'themes', file)), `${entry.id}: ${file}`);
    }
  }
});

// ── Finance urgency features (ported bill-tracker behaviour) ─────────────
const financeAt = (today, data, options = {}) => render('finances', data, { today, ...options });
const plain = value => JSON.parse(JSON.stringify(value)); // vm-realm arrays fail deepStrictEqual on prototype

test('finance autopay escalates calm → ≤7 days → ≤3 days, and a passed date stays unconfirmed', () => {
  const { autopayLevel, thresholds } = financeAt('2026-06-20').window.financeLogic;
  assert.deepEqual({ ...thresholds }, { AUTOPAY_WARN_DAYS: 7, AUTOPAY_ALERT_DAYS: 3, ALERT_WINDOW_DAYS: 7 });
  assert.deepEqual([30, 8, 7, 4, 3, 1, 0, -1].map(autopayLevel),
    ['calm', 'calm', 'warn', 'warn', 'alert', 'alert', 'alert', 'unconfirmed']);
  const bills = financeAt('2026-06-20').nodes.get('bills-body').innerHTML;
  assert.match(bills, /Gym<\/strong><span class="ap-badge ap-alert"[^>]*>⟳ autopay in 2d · Checking ending 0917/);
  assert.match(bills, /Student Loan<\/strong><span class="ap-badge ap-warn"[^>]*>⟳ autopay in 6d/);
  assert.match(bills, /Past date · autopay unconfirmed/);
  const earlier = financeAt('2026-06-14').nodes.get('bills-body').innerHTML;
  assert.match(earlier, /Student Loan<\/strong><span class="ap-badge ap-calm"/);
  assert.match(earlier, /Gym<\/strong><span class="ap-badge ap-calm"/);   // 8 days out
  assert.match(financeAt('2026-06-16').nodes.get('bills-body').innerHTML, /Gym<\/strong><span class="ap-badge ap-warn"/);
  const html = fixtures.finances.html;
  assert.match(html, /\.ap-badge\.ap-alert\{[^}]*animation:apPulse/);
  assert.match(html, /prefers-reduced-motion:reduce\)\{[\s\S]*?\.ap-badge\.ap-alert\{animation:none!important/);
});

test('finance priority alerts keep hand-written alerts first, then generate urgency-ordered alerts', () => {
  const result = financeAt('2026-06-20');
  const alerts = result.window.financeLogic.buildAutoAlerts(fixtures.finances.data, '2026-06-20');
  const byId = Object.fromEntries(alerts.map(alert => [alert.id, alert]));
  assert.equal(byId['auto-bill-bill-9'].severity, 'urgent');      // Gym autopay in 2 days
  assert.equal(byId['auto-bill-bill-9'].autopay, 'alert');
  assert.equal(byId['auto-bill-bill-10'].severity, 'warn');       // Student loan autopay in 6 days
  assert.equal(byId['auto-bill-bill-1'].severity, 'urgent');      // Rent due in 3 days
  assert.equal(byId['auto-bill-bill-6'].severity, 'urgent');      // past due, not paid
  assert.equal(byId['auto-bill-bill-2'].autopay, 'unconfirmed');
  assert.equal(byId['auto-deadline-dl-3'].severity, 'urgent');    // overdue deadline
  assert.equal(byId['auto-deadline-dl-2'].autopay, 'alert');      // autopay deadline tomorrow
  assert.equal(byId['auto-deadline-dl-1'].severity, 'warn');      // 4 days
  assert.equal(byId['auto-deadline-dl-4'].severity, 'info');      // priority, 20 days away
  for (const id of ['bill-3', 'bill-4', 'bill-11']) assert.ok(!byId['auto-bill-' + id], `paid ${id} never alerts`);
  assert.ok(!byId['auto-bill-bill-7'], 'unpaid bill 5 days out stays in the bills table only');
  assert.ok(!byId['auto-deadline-dl-5'], 'non-priority deadline beyond 7 days is not promoted');
  const rank = { urgent: 0, warn: 1, info: 2 };
  for (let i = 1; i < alerts.length; i++) {
    const [a, b] = [alerts[i - 1], alerts[i]];
    assert.ok(rank[a.severity] < rank[b.severity] || (rank[a.severity] === rank[b.severity] && a.days <= b.days), `${a.id} before ${b.id}`);
  }
  const html = result.nodes.get('alerts-list').innerHTML;
  assert.ok(html.indexOf('Client B invoice') < html.indexOf('auto</span>'), 'hand-written alert renders first');
  assert.equal(result.nodes.get('alerts-count').textContent, `${alerts.filter(a => a.severity === 'urgent').length} urgent`);
  const none = structuredClone(fixtures.finances.data);
  none.alerts = [];
  assert.match(financeAt('2026-06-20', none).nodes.get('alerts-list').innerHTML, /Gym autopay in 2d/);
});

test('finance deadlines sort by urgency: most overdue first, then soonest, priority on ties', () => {
  const result = financeAt('2026-06-20');
  const { sortDeadlines } = result.window.financeLogic;
  assert.deepEqual(plain(sortDeadlines(fixtures.finances.data.deadlines, '2026-06-20').map(r => [r.row.id, r.days])),
    [['dl-3', -8], ['dl-2', 1], ['dl-1', 4], ['dl-4', 20], ['dl-5', 87]]);
  const tie = [{ id: 'a', date: '2026-07-01' }, { id: 'b', date: '2026-07-01', priority: true }, { id: 'c', date: '2026-06-01' }];
  assert.deepEqual(plain(sortDeadlines(tie, '2026-06-20').map(r => r.row.id)), ['c', 'b', 'a']);
  assert.deepEqual(plain(sortDeadlines([{ id: 'leap', date: '2028-03-01' }], '2028-02-28').map(r => r.days)), [2]);
  const body = result.nodes.get('deadlines-body').innerHTML;
  const order = ['Submit FSA receipts', 'Renters insurance', 'Renew vehicle registration', 'Professional license', 'Q3 estimated tax'].map(label => body.indexOf(label));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.match(body, /class="dl-in overdue">8d overdue/);
  assert.match(body, /Renters insurance annual renewal<\/strong><span class="ap-badge ap-alert"/);
  const empty = structuredClone(fixtures.finances.data);
  delete empty.deadlines;
  assert.match(financeAt('2026-06-20', empty).nodes.get('deadlines-body').innerHTML, /No deadlines listed/);
});

test('finance payment history renders newest first with a payments total', () => {
  const result = financeAt('2026-06-20');
  const body = result.nodes.get('history-body').innerHTML;
  const dates = [...body.matchAll(/(\d{4}-\d{2}-\d{2})<\/td>/g)].map(m => m[1]);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(dates.length, fixtures.finances.data.history.length);
  assert.match(result.nodes.get('history-footer').innerHTML, /5 entries[\s\S]*Payments recorded: <strong>\$440<\/strong>/);
});

test('finance ACTION-PLAN.md checklist parses, archives and restores, and renders without storage', () => {
  const result = financeAt('2026-06-20');
  const { parseActionPlan } = result.window.financeLogic;
  const groups = parseActionPlan(fixtures.finances.data.actionPlan.markdown);
  assert.deepEqual(plain(groups.map(g => g.bucket)), ['Paperwork', 'Tax Planning']);
  assert.deepEqual(plain(groups[0].items.map(i => i.defaultDone)), [false, false, true]);
  const reordered = parseActionPlan('### 1. **Paperwork**\n- [x] Download May freelance invoices\n- [ ] Renew vehicle registration online before Jun 24\n');
  assert.equal(reordered[0].items[0].id, groups[0].items[2].id, 'ids follow text, not position');
  const twins = parseActionPlan('- [ ] same\n- [ ] same');
  assert.equal(new Set(twins[0].items.map(i => i.id)).size, 2);

  const target = groups[0].items[0];
  let html = result.nodes.get('todo-buckets').innerHTML;
  assert.match(html, /ACTION-PLAN\.md/);
  assert.ok(html.includes(target.label));
  const pendingBefore = Number(result.nodes.get('todo-pending').textContent.split(' ')[0]);
  result.window.todoArchive(target.id, true);
  html = result.nodes.get('todo-buckets').innerHTML;
  assert.ok(!html.includes(`data-id="${target.id}"`));
  assert.match(html, /show 1 archived/);
  assert.equal(JSON.parse(result.storage.get('fin-todos-archived'))[target.id], true);
  assert.equal(Number(result.nodes.get('todo-pending').textContent.split(' ')[0]), pendingBefore - 1);
  result.window.todoArchive(target.id, false);
  assert.ok(result.nodes.get('todo-buckets').innerHTML.includes(`data-id="${target.id}"`));

  const seeded = financeAt('2026-06-20', undefined, { seed: { 'fin-todos-archived': JSON.stringify({ [target.id]: true }) } });
  assert.ok(!seeded.nodes.get('todo-buckets').innerHTML.includes(`data-id="${target.id}"`));
  for (const storage of ['denied', 'corrupt']) {
    const fallback = financeAt('2026-06-20', undefined, { storage }).nodes.get('todo-buckets').innerHTML;
    assert.ok(fallback.includes(`data-id="${target.id}"`), storage);
    assert.match(fallback, /todo-item done[^>]*>[\s\S]*?Download May freelance invoices/, `${storage}: [x] default`);
  }
});

test('finance data from before deadlines/history/actionPlan still validates and renders', async () => {
  const { loadProfile, validateData } = await import('../scripts/lib/dashboard-core.mjs');
  const legacy = structuredClone(fixtures.finances.data);
  for (const key of ['deadlines', 'history', 'actionPlan']) delete legacy[key];
  for (const bill of legacy.bills) delete bill.autopayAccount;
  assert.doesNotThrow(() => validateData(legacy, loadProfile('finances')));
  const result = financeAt('2026-06-20', legacy);
  assert.match(result.nodes.get('history-body').innerHTML, /No history yet/);
  assert.ok(result.nodes.get('todo-buckets').innerHTML.includes('Pay This Week'));
  const missingRequired = structuredClone(legacy);
  delete missingRequired.bills;
  assert.throws(() => validateData(missingRequired, loadProfile('finances')), /data\.bills/);
});
