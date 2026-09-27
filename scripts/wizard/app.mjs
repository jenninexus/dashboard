const $ = id => document.getElementById(id);
const token = location.hash.slice(1) || sessionStorage.getItem('dashboard-capability') || '';
if (/^[a-f0-9]{64}$/.test(token)) sessionStorage.setItem('dashboard-capability', token);
history.replaceState(null, '', location.pathname);
let catalog, current, draft, selectionId, busy = false, dirty = false;
let lastActivityPing = 0;
// Only actual interaction renews the server lease; an abandoned tab does not keep it alive.
function activity() {
  if (Date.now() - lastActivityPing < 30000 || !/^[a-f0-9]{64}$/.test(token)) return;
  lastActivityPing = Date.now();
  void api('ping').catch(() => {});
}
document.addEventListener('input', activity);
document.addEventListener('pointerdown', activity);
document.addEventListener('keydown', activity);
window.addEventListener('focus', activity);
const source = () => $('json-source').value;
const normalized = path => path.replace(/\[\d+\]/g, '[]');
const keyPath = path => path.replace(/\[(\d+)\]/g, '.$1').split('.');
function at(object, path) { return keyPath(path).reduce((value, key) => value?.[key], object); }
function set(path, value) { const keys = keyPath(path), key = keys.pop(); const parent = keys.reduce((item, part) => item[part], draft); parent[key] = value; dirty = true; $('json-source').value = JSON.stringify(draft, null, 2) + '\n'; }
function el(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function status(message, bad = false) { $('status').textContent = message; $('status').classList.toggle('error', bad); if (bad) $('status').focus(); }
async function api(path, body) {
  const response = await fetch('/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Dashboard-Token': token, ...(selectionId ? { 'X-Dashboard-Selection': selectionId } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The local editor could not complete this action.');
  return result;
}
async function action(operation) {
  if (busy) return;
  busy = true;
  document.body.setAttribute('aria-busy', 'true');
  document.querySelector('main').inert = true;
  try { await operation(); } catch (error) { status(error.message, true); }
  finally { busy = false; document.body.removeAttribute('aria-busy'); document.querySelector('main').inert = false; }
}
function acceptsDiscard() { return !dirty || window.confirm('Discard unsaved draft changes and reload the saved data?'); }
function themeChoices() {
  const profile = catalog.profiles.find(item => item.id === $('profile').value);
  $('theme').replaceChildren(...catalog.themes.filter(theme => theme.compatibleProfiles.includes(profile.id)).map(theme => { const option = el('option', theme.name); option.value = theme.id; option.selected = theme.id === profile.theme; return option; }));
}
function showState(state) {
  current = state;
  selectionId = state.selectionId;
  draft = state.data;
  dirty = false;
  $('output-path').value = state.output;
  $('selected-path').textContent = state.output;
  $('setup').hidden = true;
  $('editor').hidden = false;
  $('editor-summary').textContent = `${catalog.profiles.find(item => item.id === state.profileId)?.name || state.profileId} · ${state.themeId}`;
  $('json-source').value = state.source;
  $('restore').disabled = !state.hasBackup;
  $('backup-status').textContent = state.hasBackup ? 'dashboard.html.bak holds the previous HTML. Restore reads its data and preserves your current custom layout.' : 'Your first change will create dashboard.html.bak. Later changes replace that one backup.';
  $('fields').disabled = !draft;
  renderForms();
  if (state.validationError) { $('advanced').open = true; status(`Saved JSON needs repair: ${state.validationError}`, true); }
}

function renderForms() {
  $('forms').replaceChildren();
  if (!draft) return;
  const allFields = current.schema.sections.flatMap(section => section.fields);
  const descriptor = path => allFields.find(field => field.path === normalized(path));
  const collection = path => current.schema.collections.find(item => item.path === normalized(path));
  function hasFields(path) { const prefix = normalized(path); return allFields.some(field => field.path === prefix || field.path.startsWith(prefix + '.') || field.path.startsWith(prefix + '[]')); }
  function templateFor(path) {
    let value = current.example;
    for (const part of keyPath(path)) value = Array.isArray(value) ? value[0] : value?.[part];
    return Array.isArray(value) ? value[0] : value;
  }
  function blank(value, path) {
    const field = descriptor(path);
    if (path.endsWith('.id')) return 'row-' + crypto.randomUUID();
    if (field?.nullable) return null;
    if (field?.type === 'enum') return field.values[0];
    if (field?.type === 'date') { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
    if (field?.type === 'number') return field.min ?? 0;
    if (field?.type === 'boolean') return false;
    if (field?.type === 'string') return field.pattern?.startsWith('^#') ? '#000000' : '';
    if (Array.isArray(value)) return [];
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, blank(child, `${path}.${key}`)]));
    return typeof value === 'number' ? 0 : typeof value === 'boolean' ? false : '';
  }
  function render(container, value, path, title) {
    const field = descriptor(path), list = collection(path);
    if (Array.isArray(value)) {
      const box = el('div', undefined, 'nested');
      box.append(el('h3', list?.label || title));
      value.forEach((row, index) => {
        const record = el('details', undefined, 'record');
        const summary = typeof row === 'object' && row ? row.name || row.label || row.title || row.source || row.date : row;
        record.append(el('summary', `${index + 1}. ${summary || 'New record'}`));
        const fields = el('div', undefined, 'record-fields');
        render(fields, row, `${path}[${index}]`, `Item ${index + 1}`);
        record.append(fields);
        const remove = el('button', 'Remove record', 'subtle'); remove.type = 'button';
        remove.disabled = value.length <= (list?.minItems || 0);
        remove.addEventListener('click', () => { value.splice(index, 1); set(path, value); renderForms(); });
        record.append(remove); box.append(record);
      });
      const add = el('button', `Add ${list?.label?.replace(/s$/, '').toLowerCase() || 'record'}`, 'subtle'); add.type = 'button';
      add.disabled = value.length >= (list?.maxItems || 1000);
      add.addEventListener('click', () => { value.push(blank(templateFor(path), `${path}[${value.length}]`)); set(path, value); renderForms(); const records = $('forms').querySelectorAll('details.record'); if (records.length) records[records.length-1].open = true; });
      box.append(add); container.append(box); return;
    }
    if (value !== null && typeof value === 'object') {
      const keys = new Set(Object.keys(value));
      // Include missing optional declared scalar fields while keeping unknown fields in the draft untouched.
      const prefix = normalized(path) + '.';
      for (const candidate of allFields) if (candidate.path.startsWith(prefix)) {
        const key = candidate.path.slice(prefix.length).split(/[.\[]/)[0]; if (key) keys.add(key);
      }
      for (const key of keys) if (hasFields(`${path}.${key}`)) render(container, value[key], `${path}.${key}`, key);
      return;
    }
    if (!field) return;
    const label = el('label', field.label + (field.unit ? ` (${field.unit})` : ''));
    const id = 'field-' + path.replace(/[^a-z0-9]/gi, '-'); label.htmlFor = id;
    let input;
    if (field.type === 'enum') {
      input = el('select');
      for (const choice of field.values) { const option = el('option', choice); option.value = choice; input.append(option); }
      input.value = value ?? field.values[0];
    } else {
      input = el('input'); input.type = field.type === 'boolean' ? 'checkbox' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
      if (field.type === 'boolean') { input.checked = Boolean(value); label.className = 'check'; }
      else input.value = value ?? '';
      if (field.type === 'number') { input.step = 'any'; if (field.min !== undefined) input.min = field.min; if (field.max !== undefined) input.max = field.max; }
      if (field.maxLength) input.maxLength = field.maxLength;
    }
    input.id = id;
    if (path.endsWith('.id') || path === 'schemaVersion') input.readOnly = true;
    input.addEventListener('input', () => {
      let next = field.type === 'boolean' ? input.checked : field.type === 'number' ? (input.value === '' ? null : Number(input.value)) : input.value;
      if (input.value === '' && field.nullable) next = null;
      set(path, next);
    });
    label.append(input);
    if (field.help || field.nullable) { const help = el('span', [field.help, field.nullable ? 'Leave blank for unknown (null).' : ''].filter(Boolean).join(' '), 'field-help'); help.id = id + '-help'; input.setAttribute('aria-describedby', help.id); label.append(help); }
    container.append(label);
  }
  const roots = new Set();
  for (const section of current.schema.sections) {
    const root = section.fields[0]?.path.split('.')[0].replace('[]', '');
    if (!root || roots.has(root)) continue;
    roots.add(root);
    const group = el('details', undefined, 'group'); group.open = root === 'profile'; group.append(el('summary', section.label));
    const fields = el('div', undefined, 'record-fields'); render(fields, draft[root], root, section.label); group.append(fields); $('forms').append(group);
  }
}

$('folder-form').addEventListener('submit', event => { event.preventDefault(); void action(async () => {
  if (!acceptsDiscard()) return;
  const selected = await api('select', { path: $('output-path').value });
  selectionId = selected.selectionId;
  $('selected-path').textContent = selected.output;
  $('preview-panel').hidden = true;
  if (selected.state) { showState(selected.state); if (!selected.state.validationError) status('Loaded your saved dashboard.'); }
  else { current = null; draft = null; dirty = false; $('setup').hidden = false; $('editor').hidden = true; status('Folder selected. Choose a profile and theme to begin.'); }
}); });
$('profile').addEventListener('change', themeChoices);
$('setup-form').addEventListener('submit', event => { event.preventDefault(); void action(async () => {
  const request = { profileId: $('profile').value, themeId: $('theme').value };
  if ($('name').value) request.name = $('name').value;
  if ($('domain').value) request.domain = $('domain').value;
  showState(await api('scaffold', request)); status('Your fictional starter dashboard is ready. Edit its fields and save when ready.');
}); });
$('save').addEventListener('click', () => void action(async () => { const result = await api('save', { source: source(), revision: current.revision }); showState(result); status(result.changed ? 'Saved data.json and updated dashboard.html. Your previous HTML is the rotating backup.' : 'Already up to date.'); }));
$('reload').addEventListener('click', () => void action(async () => { if (!acceptsDiscard()) return; const result = await api('state'); showState(result); if (!result.validationError) status('Reloaded saved JSON and current dashboard revision.'); }));
$('update').addEventListener('click', () => void action(async () => { if (!acceptsDiscard()) return; const result = await api('update', {}); showState(result); status(result.changed ? 'Updated HTML from data.json without changing your JSON file.' : 'HTML already matches data.json.'); }));
$('json-source').addEventListener('input', () => { dirty = true; $('fields').disabled = true; status('JSON draft changed. Apply it to refresh the form fields, or save the validated JSON directly.'); });
async function applyJson() { const result = await api('validate', { source: source() }); draft = result.data; $('fields').disabled = false; renderForms(); status('JSON validated. Fields and unknown data are preserved in your draft.'); }
$('apply-json').addEventListener('click', () => void action(applyJson));
$('import').addEventListener('change', () => void action(async () => { const file = $('import').files[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) throw new Error('Import must be at most 2 MiB.'); $('json-source').value = await file.text(); dirty = true; $('fields').disabled = true; await applyJson(); status('Imported and validated a draft. Save to write it to your dashboard.'); $('import').value = ''; }));
$('export').addEventListener('click', () => void action(async () => { await api('validate', { source: source() }); const url = URL.createObjectURL(new Blob([source()], { type: 'application/json' })); const link = el('a'); link.href = url; link.download = 'data.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); status('Exported a plaintext JSON copy of your draft.'); }));
$('preview').addEventListener('click', () => void action(async () => { const result = await api('preview', { source: source() }); $('preview-frame').src = result.url; $('preview-panel').hidden = false; $('preview-panel').scrollIntoView({ behavior: 'auto', block: 'start' }); status('Preview generated from your draft. Files have not changed.'); }));
$('restore').addEventListener('click', () => void action(async () => { if (!window.confirm('Restore the data embedded in the previous HTML backup? Current data and HTML will be replaced, and current HTML becomes the new rotating backup.')) return; showState(await api('restore', { revision: current.revision })); status('Restored previous data and rebuilt the current layout.'); }));
$('stop').addEventListener('click', () => void action(async () => { if (dirty && !window.confirm('Stop and discard this unsaved draft?')) return; await api('stop', {}); sessionStorage.removeItem('dashboard-capability'); dirty = false; status('Editor stopped. The local port is released. You may close this tab.'); for (const node of document.querySelectorAll('button,input,select,textarea')) node.disabled = true; $('preview-frame').removeAttribute('src'); }));
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
void action(async () => {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Open the complete editor URL printed by Dashboard.cmd or npm run dashboard. Each launch has its own private link.');
  catalog = await api('catalog');
  $('profile').replaceChildren(...catalog.profiles.map(profile => { const option = el('option', profile.name); option.value = profile.id; return option; }));
  themeChoices(); $('output-path').value = catalog.initialPath;
  $('session-note').textContent = `Only on this computer. Automatically stops after ${catalog.idleMinutes} idle minutes.`;
  if (catalog.state) { showState(catalog.state); if (!catalog.state.validationError) status('Welcome back. Your saved dashboard is loaded.'); }
  else status('Choose a folder to create a dashboard or open an existing one.');
});
