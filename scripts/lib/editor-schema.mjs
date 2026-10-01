/** Compact dashboard editor contract; deliberately not a JSON Schema implementation. */
const supportedPatterns = new Set(['^[a-zA-Z0-9_-]+$', '^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$', '^\\d{4}-(0[1-9]|1[0-2])$']);
const formulas = {
  liquidHoldings: 'sum(holdings.accounts[].amount)',
  monthlyIncome: 'sum(income[].monthlyEst where status is active or variable)',
  billCycleTotal: 'sum(bills[].amount where due starts with profile.billCycle)',
  billsOutstanding: 'sum(cycle bills[].amount where status is not paid; autopay is unconfirmed)',
  loanBalance: 'principal - paidToDate when balanceBasis is principal-minus-paid; explicit stillOwed must agree',
  netWorth: 'liquidHoldings - sum(loanBalance) only when profile.liabilitiesComplete; otherwise unknown',
  savingsRate: 'round((monthlyIncome - profile.monthlyExpenses) / monthlyIncome * 100) when both known and income > 0; otherwise unknown',
};
const fail = message => { throw new Error(`Editor contract: ${message}`); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function validPath(path) {
  return typeof path === 'string' && path.length < 200 && /^[A-Za-z_][\w]*(?:\[\])?(?:\.[A-Za-z_][\w]*(?:\[\])?)*$/.test(path) &&
    !path.split('.').some(part => ['__proto__', 'constructor', 'prototype'].includes(part.replace('[]', '')));
}

export function validateEditorSchema(schema, profileId, version) {
  if (!object(schema) || schema.format !== 'dashboard-editor' || schema.version !== version || schema.profile !== profileId ||
      schema.unknownFields !== 'preserve' || !Array.isArray(schema.sections) || !Array.isArray(schema.collections)) fail('unsupported format, profile or version');
  const paths = new Set(), sectionIds = new Set();
  for (const section of schema.sections) {
    if (!object(section) || typeof section.id !== 'string' || sectionIds.has(section.id) || typeof section.label !== 'string' || !Array.isArray(section.fields)) fail('invalid or duplicate section');
    sectionIds.add(section.id);
    for (const field of section.fields) {
      if (!object(field) || !validPath(field.path) || paths.has(field.path) || typeof field.label !== 'string' ||
          !['string', 'number', 'boolean', 'date', 'enum'].includes(field.type) || typeof field.required !== 'boolean') fail('invalid or duplicate field');
      paths.add(field.path);
      if (field.nullable !== undefined && typeof field.nullable !== 'boolean') fail(`${field.path}: invalid nullable flag`);
      if (field.multiline !== undefined && (typeof field.multiline !== 'boolean' || field.type !== 'string')) fail(`${field.path}: multiline applies only to string fields`);
      for (const bound of ['min', 'max', 'maxLength']) if (field[bound] !== undefined && (!Number.isFinite(field[bound]) || Math.abs(field[bound]) > Number.MAX_SAFE_INTEGER)) fail(`${field.path}: invalid bound`);
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) fail(`${field.path}: inverted bounds`);
      if (field.maxLength !== undefined && (!Number.isInteger(field.maxLength) || field.maxLength < 1 || field.maxLength > 65536)) fail(`${field.path}: invalid maximum length`);
      if (field.type === 'enum' && (!Array.isArray(field.values) || !field.values.length || field.values.some(value => typeof value !== 'string') || new Set(field.values).size !== field.values.length)) fail(`${field.path}: invalid enum values`);
      if (field.pattern !== undefined && !supportedPatterns.has(field.pattern)) fail(`${field.path}: unsupported pattern; add a reviewed bounded pattern to the contract engine`);
    }
  }
  const collections = new Set();
  for (const collection of schema.collections) {
    if (!object(collection) || !validPath(collection.path) || collections.has(collection.path) || typeof collection.label !== 'string' ||
        typeof collection.required !== 'boolean' || !Number.isInteger(collection.maxItems) || collection.maxItems < 0 || collection.maxItems > 10000 ||
        !Number.isInteger(collection.minItems) || collection.minItems < 0 || collection.minItems > collection.maxItems ||
        (collection.identity !== null && (!/^[A-Za-z_][\w]*$/.test(collection.identity || '') ||
          ['__proto__', 'constructor', 'prototype'].includes(collection.identity)))) fail('invalid or duplicate collection');
    collections.add(collection.path);
  }
  if (schema.derived !== undefined && !Array.isArray(schema.derived)) fail('derived must be an array');
  const derivations = new Set();
  for (const derived of schema.derived || []) {
    if (profileId !== 'finances' || !object(derived) || !Object.hasOwn(formulas, derived.path) ||
        derived.formula !== formulas[derived.path] || derivations.has(derived.path)) fail('unknown, changed or duplicate derivation');
    derivations.add(derived.path);
  }
  return schema;
}

export function valuesAt(data, path) {
  let values = [{ value: data, path: '' }];
  for (const segment of path.split('.')) {
    const array = segment.endsWith('[]'), key = array ? segment.slice(0, -2) : segment;
    values = values.flatMap(entry => {
      const value = object(entry.value) && Object.hasOwn(entry.value, key) ? entry.value[key] : undefined;
      const location = entry.path ? `${entry.path}.${key}` : key;
      if (!array) return [{ value, path: location }];
      if (!Array.isArray(value)) return [{ value: undefined, path: location }];
      return value.map((child, index) => ({ value: child, path: `${location}[${index}]` }));
    });
  }
  return values;
}

function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}

export function validateEditorData(data, schema) {
  for (const collection of schema.collections) for (const entry of valuesAt(data, collection.path)) {
    if (entry.value === undefined && !collection.required) continue;
    if (!Array.isArray(entry.value)) fail(`${entry.path}: required array is missing or invalid`);
    if (entry.value.length < collection.minItems || entry.value.length > collection.maxItems) fail(`${entry.path}: requires ${collection.minItems}–${collection.maxItems} records`);
    if (collection.identity) {
      const ids = new Set();
      for (const row of entry.value) {
        const id = object(row) ? row[collection.identity] : undefined;
        if (typeof id !== 'string' || !id || ids.has(id)) fail(`${entry.path}: missing or duplicate ${collection.identity}`);
        ids.add(id);
      }
    }
  }
  // Fields inside an optional collection that is absent entirely are not required.
  const absent = schema.collections.filter(item => !item.required && valuesAt(data, item.path).every(entry => entry.value === undefined)).map(item => item.path + '[]');
  for (const section of schema.sections) for (const field of section.fields) for (const entry of valuesAt(data, field.path)) {
    if (absent.some(prefix => field.path.startsWith(prefix))) continue;
    const value = entry.value;
    if (value === undefined && !field.required) continue;
    if (value === null && field.nullable) continue;
    const expected = ['date', 'enum'].includes(field.type) ? 'string' : field.type;
    if (typeof value !== expected) fail(`${entry.path}: expected ${field.type}${field.nullable ? ' or null' : ''}`);
    if (field.type === 'number' && (!Number.isFinite(value) || value < (field.min ?? -Infinity) || value > (field.max ?? Infinity))) fail(`${entry.path}: outside allowed numeric range`);
    if (typeof value === 'string' && value.length > (field.maxLength ?? 65536)) fail(`${entry.path}: text is too long`);
    if (field.type === 'enum' && !field.values.includes(value)) fail(`${entry.path}: choose ${field.values.join(', ')}`);
    if (field.type === 'date' && !isDate(value)) fail(`${entry.path}: expected a valid YYYY-MM-DD calendar date`);
    if (field.pattern && !new RegExp(field.pattern).test(value)) fail(`${entry.path}: value does not match the expected format`);
  }
  if (schema.profile === 'finances' && schema.derived?.length) validateFinance(data, schema.derived);
  return data;
}

function validateFinance(data, declared) {
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  const sum = rows => round(rows.reduce((total, value) => total + value, 0));
  const loanBalances = data.loans.map((loan, index) => {
    if (loan.balanceBasis !== 'principal-minus-paid') return loan.stillOwed;
    const balance = round(loan.principal - loan.paidToDate);
    if (balance < 0 || Math.abs(balance - loan.stillOwed) > 0.005) fail(`loans[${index}].stillOwed: must equal principal minus paidToDate`);
    return balance;
  });
  const cycle = data.bills.filter(bill => bill.due.startsWith(data.profile.billCycle + '-'));
  const liquidHoldings = sum(data.holdings.accounts.map(row => row.amount));
  const monthlyIncome = sum(data.income.filter(row => ['active', 'variable'].includes(row.status)).map(row => row.monthlyEst));
  const derived = {
    liquidHoldings, monthlyIncome, billCycleTotal: sum(cycle.map(row => row.amount)),
    billsOutstanding: sum(cycle.filter(row => row.status !== 'paid').map(row => row.amount)),
    netWorth: data.profile.liabilitiesComplete ? round(liquidHoldings - sum(loanBalances)) : null,
    savingsRate: data.profile.monthlyExpenses !== null && monthlyIncome > 0 ? Math.round((monthlyIncome - data.profile.monthlyExpenses) / monthlyIncome * 100) : null,
  };
  for (const { path } of declared) if (Object.hasOwn(derived, path) && Object.hasOwn(data, path)) {
    if (data[path] !== derived[path]) fail(`${path}: stored value disagrees with its declared derivation`);
  }
}
