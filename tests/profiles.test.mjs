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
  const storage = new Map();
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
  return { nodes, all, storage, storageReads, derived: sandbox.testDerived };
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
