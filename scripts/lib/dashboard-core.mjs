import * as fs from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import { LIMITS, parseStrictJson, serializeJson } from './strict-json.mjs';
import { assertOutputRoot, outputFile, sourceFile, rejectLinks } from './dashboard-paths.mjs';
import { validateEditorSchema, validateEditorData } from './editor-schema.mjs';

export { LIMITS, parseStrictJson, serializeJson, assertOutputRoot };
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DATA_START = '<!-- dashboard:data:start -->';
export const DATA_END = '<!-- dashboard:data:end -->';
export const THEME_START = '<!-- dashboard:theme:start -->';
export const THEME_END = '<!-- dashboard:theme:end -->';
const CONTRACT_VERSION = 1;
const GENERATOR_VERSION = '3.0.0';
const HTML_LIMIT = 16 * 1024 * 1024;
const hash = value => createHash('sha256').update(value).digest('hex');
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(message); };

function readBytes(path, max = LIMITS.bytes) {
  if (fs.statSync(path).size > max) fail(`${path}: file exceeds ${max} bytes`);
  const value = fs.readFileSync(path);
  if (value.length > max) fail(`${path}: file exceeds ${max} bytes`);
  return value;
}

function decode(bytes, label) {
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { fail(`${label}: invalid UTF-8`); }
}

function readJson(path) {
  return parseStrictJson(decode(readBytes(path), path), path);
}

export function loadProfile(id, { root = ROOT } = {}) {
  if (typeof id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(id)) fail('Invalid profile id');
  const profileRoot = join(root, 'profiles', id);
  const manifest = readJson(sourceFile(root, `profiles/${id}/profile.json`));
  if (manifest.id !== id || manifest.status !== 'ready') fail(`Profile ${id} is not a ready matching manifest`);
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(manifest.dataInjection?.scriptId || '')) fail('Invalid profile data script id');
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(manifest.theme || '')) fail('Invalid profile theme id');
  if (manifest.dataContractVersion !== undefined && manifest.dataContractVersion !== CONTRACT_VERSION) fail('Unsupported profile data contract version');
  const renderPath = sourceFile(root, manifest.render);
  if (resolve(renderPath) !== resolve(profileRoot, `${id}.html`)) fail('Profile renderer must belong to its profile');
  const example = readJson(sourceFile(profileRoot, manifest.exampleData));
  const template = decode(readBytes(renderPath, HTML_LIMIT), 'Profile HTML');
  const themeCss = decode(readBytes(sourceFile(root, `themes/${manifest.theme}.css`)), 'Theme CSS');
  if (/<\/style\b/i.test(themeCss)) fail('Theme CSS contains an unsafe style terminator');
  const contractVersion = manifest.dataContractVersion ?? CONTRACT_VERSION;
  const editorSchema = validateEditorSchema(readJson(sourceFile(profileRoot, manifest.editorSchema)), id, contractVersion);
  const profile = { ...manifest, example, template, themeCss, root, contractVersion, editorSchema };
  validateData(example, profile);
  return profile;
}

export function loadThemes({ root = ROOT } = {}) {
  const manifest = readJson(sourceFile(root, 'themes/manifest.json'));
  if (manifest.format !== 'dashboard-themes' || manifest.version !== 1 || !Array.isArray(manifest.themes)) fail('Unsupported public theme manifest');
  const ids = new Set();
  return manifest.themes.map(theme => {
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(theme.id || '') || ids.has(theme.id) || typeof theme.name !== 'string' ||
        typeof theme.version !== 'string' || !Array.isArray(theme.compatibleProfiles) ||
        !Array.isArray(theme.files) || !theme.files.length) fail('Invalid public theme entry');
    ids.add(theme.id);
    const css = theme.files.map(file => {
      if (!/^[a-z0-9.-]+\.css$/.test(file)) fail('Unsafe public theme file');
      return decode(readBytes(sourceFile(root, `themes/${file}`)), 'Theme CSS');
    }).join('\n');
    if (/<\/style\b/i.test(css)) fail('Unsafe public theme CSS');
    return { ...theme, css };
  });
}

/** Public theme roots describe dark palettes. Keep profile light tokens active. */
export function scopeThemeRoots(css) {
  // Mask comments and quoted content so prose and string values remain byte-identical.
  const mask = css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, match => ' '.repeat(match.length));
  const roots = [...mask.matchAll(/:root\b/g)];
  for (const root of roots) {
    const start = Math.max(mask.lastIndexOf('{', root.index), mask.lastIndexOf('}', root.index), mask.lastIndexOf(';', root.index)) + 1;
    if (mask.slice(start, root.index).trim() || !/^\s*\{/.test(mask.slice(root.index + root[0].length))) {
      fail('Unsupported public theme :root selector; use a standalone :root token block');
    }
  }
  let scoped = css;
  for (const root of roots.reverse()) scoped = scoped.slice(0, root.index) + ':root:not([data-theme="light"])' + scoped.slice(root.index + root[0].length);
  return scoped;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}

/** Version 1 preserves unknown fields, while checking the existing profile's known value types. */
export function validateData(data, profile) {
  if (!plainObject(data)) fail('Dashboard data must be a JSON object');
  // Also validate callers passing JS objects: reject cycles, prototypes, accessors and non-JSON values.
  const seen = new Set();
  function walk(value, path, depth = 0) {
    if (depth > LIMITS.depth) fail(`${path}: nesting limit exceeded`);
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) fail(`${path}: invalid numeric range`);
      return;
    }
    if (typeof value === 'string') {
      if (value.length > LIMITS.string) fail(`${path}: string limit exceeded`);
      return;
    }
    if (typeof value !== 'object' || seen.has(value)) fail(`${path}: value must be acyclic JSON`);
    if (![Object.prototype, Array.prototype, null].includes(Object.getPrototypeOf(value))) fail(`${path}: unsupported object prototype`);
    seen.add(value);
    const entries = Object.entries(Object.getOwnPropertyDescriptors(value)).filter(([key]) => key !== 'length' || !Array.isArray(value));
    if (Object.getOwnPropertySymbols(value).length) fail(`${path}: symbol keys are not JSON`);
    if (entries.length > LIMITS.collection) fail(`${path}: collection limit exceeded`);
    if (Array.isArray(value) && (value.length > LIMITS.collection || entries.length !== value.length ||
        entries.some(([key]) => !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length))) {
      fail(`${path}: arrays must be bounded, dense JSON arrays without extra properties`);
    }
    for (const [key, descriptor] of entries) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) fail(`${path}: dangerous key ${key}`);
      if (!('value' in descriptor)) fail(`${path}: accessors are not JSON`);
      const child = descriptor.value;
      const childPath = `${path}.${key}`;
      walk(child, childPath, depth + 1);
      if (key === 'id') {
        if (typeof child !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(child)) fail(`${childPath}: invalid id`);
      }
      if (['url', 'href', 'website'].includes(key) && child !== null && child !== '') {
        let url;
        try { url = new URL(child); } catch { fail(`${childPath}: expected an absolute HTTP(S) URL`); }
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || /[\x00-\x20\x7f]/.test(child)) {
          fail(`${childPath}: unsafe URL; use HTTP(S) without credentials or whitespace`);
        }
      }
      const dateKey = ['date', 'dob', 'last_updated', 'last_assessed', 'dataAsOf'].includes(key);
      const legacyMonth = profile.id === 'seo' && /^data\.milestones\.\d+\.date$/.test(childPath) &&
        typeof child === 'string' && /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/.test(child);
      if (dateKey && !legacyMonth && !validDate(child)) fail(`${childPath}: expected a valid YYYY-MM-DD calendar date`);
      if (typeof child === 'number' && ['pct', 'progress'].includes(key) && (child < 0 || child > 100)) {
        fail(`${childPath}: expected a percentage between 0 and 100`);
      }
    }
    if (Array.isArray(value)) {
      const ids = new Set();
      for (const row of value) if (plainObject(row)) {
        const id = Object.getOwnPropertyDescriptor(row, 'id')?.value;
        if (id === undefined) continue;
        if (ids.has(id)) fail(`${path}: duplicate id`);
        ids.add(id);
      }
    }
    seen.delete(value);
  }
  walk(data, 'data');
  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > LIMITS.bytes) fail('Dashboard data exceeds size limit');
  for (const [key, example] of Object.entries(profile.example)) {
    if (key.startsWith('_')) continue;
    if (!Object.hasOwn(data, key)) fail(`data.${key}: required for profile ${profile.id}`);
    if (!profile.editorSchema) checkShape(data[key], example, `data.${key}`);
  }
  if (profile.editorSchema) validateEditorData(data, profile.editorSchema);
  return data;
}

function checkShape(value, example, path) {
  if (example === null) {
    if (value !== null) fail(`${path}: expected null or a supported profile value type`);
    return;
  }
  if (Array.isArray(example)) {
    if (!Array.isArray(value)) fail(`${path}: expected an array`);
    if (example.length) for (const [index, child] of value.entries()) {
      let mismatch;
      let matches = false;
      for (const candidate of example) {
        try { checkShape(child, candidate, `${path}.${index}`); matches = true; break; }
        catch (error) { mismatch = error; }
      }
      if (!matches) throw mismatch;
    }
  } else if (plainObject(example)) {
    if (!plainObject(value)) fail(`${path}: expected an object`);
    for (const key of Object.keys(value)) if (Object.hasOwn(example, key)) checkShape(value[key], example[key], `${path}.${key}`);
  } else if (typeof value !== typeof example) fail(`${path}: expected ${typeof example}`);
}

function uniquePosition(html, token) {
  const index = html.indexOf(token);
  if (index < 0 || html.indexOf(token, index + token.length) >= 0) fail(`Expected exactly one ${token}`);
  return index;
}

function decodeAttribute(value) {
  return value.replace(/&#(x[\da-f]+|\d+);?/gi, (_, code) => String.fromCodePoint(parseInt(code[0].toLowerCase() === 'x' ? code.slice(1) : code, code[0].toLowerCase() === 'x' ? 16 : 10)))
    .replace(/&(?:quot|apos|amp|lt|gt);/g, entity => ({ '&quot;': '"', '&apos;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>' })[entity]);
}

function scriptRegion(html, id) {
  const matches = [];
  // Attribute-aware scanning also rejects duplicate ids on non-script elements and entity aliases.
  for (const tag of html.matchAll(/<([a-z][\w:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const attributes = [...tag[0].matchAll(/[\s/]+([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)];
    const ids = attributes.filter(attr => attr[1].toLowerCase() === 'id');
    if (!ids.some(attr => decodeAttribute(attr[2] ?? attr[3] ?? attr[4] ?? '') === id)) continue;
    if (ids.length !== 1) fail(`Duplicate id attribute for ${id}`);
    if (tag[1].toLowerCase() !== 'script') fail(`Data id ${id} belongs to a non-script element`);
    const types = attributes.filter(attr => attr[1].toLowerCase() === 'type');
    if (types.length !== 1 || decodeAttribute(types[0][2] ?? types[0][3] ?? types[0][4] ?? '').toLowerCase() !== 'application/json') {
      fail(`Script ${id} must have type application/json`);
    }
    const start = tag.index;
    const bodyStart = start + tag[0].length;
    const close = /<\/script\s*>/gi;
    close.lastIndex = bodyStart;
    const end = close.exec(html);
    if (!end) fail(`Missing closing script for ${id}`);
    matches.push({ start, bodyStart, bodyEnd: end.index, end: end.index + end[0].length });
  }
  if (matches.length !== 1) fail(`Expected exactly one script with id ${id}`);
  return matches[0];
}

export function replaceEmbeddedData(html, scriptId, data, { marked = true } = {}) {
  const region = scriptRegion(html, scriptId);
  if (marked) {
    const start = uniquePosition(html, DATA_START) + DATA_START.length;
    const end = uniquePosition(html, DATA_END);
    if (start > region.start || end < region.end || html.slice(start, region.start).trim() || html.slice(region.end, end).trim()) {
      fail('Data markers must enclose only the matching JSON script');
    }
  } else if (html.includes(DATA_START) || html.includes(DATA_END)) fail('Profile template already contains generated data markers');
  const replaced = html.slice(0, region.bodyStart) + '\n' + serializeJson(data) + '\n' + html.slice(region.bodyEnd);
  if (marked) return replaced;
  const after = scriptRegion(replaced, scriptId);
  return replaced.slice(0, after.start) + DATA_START + '\n' + replaced.slice(after.start, after.end) + '\n' + DATA_END + replaced.slice(after.end);
}

function metadataFor(profile) {
  return {
    format: 'dashboard-output', version: 1, profileId: profile.id, dataContractVersion: profile.contractVersion,
    template: { version: 1, sha256: hash(profile.template) },
    theme: { id: profile.theme, version: 1, sourceVersion: profile.themeVersion || '1.0.0', sha256: hash(profile.themeCss) },
    scriptId: profile.dataInjection.scriptId, generatorVersion: GENERATOR_VERSION,
  };
}

function validateMetadata(meta, profile, html) {
  if (!plainObject(meta) || meta.format !== 'dashboard-output' || meta.version !== 1 ||
      meta.profileId !== profile.id || meta.dataContractVersion !== profile.contractVersion ||
      meta.scriptId !== profile.dataInjection.scriptId || meta.generatorVersion !== GENERATOR_VERSION ||
      meta.template?.version !== 1 || !/^[a-f0-9]{64}$/.test(meta.template?.sha256 || '') ||
      meta.theme?.version !== 1 || !/^[a-z][a-z0-9-]{0,63}$/.test(meta.theme?.id || '') ||
      !/^[a-f0-9]{64}$/.test(meta.theme?.sha256 || '')) fail('Unsupported or mismatched dashboard metadata/profile/contract version');
  const region = scriptRegion(html, 'dashboard-provenance');
  const embedded = parseStrictJson(html.slice(region.bodyStart, region.bodyEnd), 'Embedded provenance');
  if (serializeJson(embedded) !== serializeJson(meta)) fail('Metadata does not match embedded dashboard provenance');
  const themeStart = uniquePosition(html, THEME_START);
  const themeEnd = uniquePosition(html, THEME_END);
  if (themeEnd <= themeStart) fail('Invalid generated theme markers');
}

export function scaffoldDashboard({ profileId, out = 'my-dashboard', name, domain, themeId, root = ROOT } = {}) {
  const profile = loadProfile(profileId, { root });
  const theme = loadThemes({ root }).find(item => item.id === (themeId || profile.theme));
  if (!theme || !theme.compatibleProfiles.includes(profileId)) fail('Selected theme is not compatible with this profile');
  profile.theme = theme.id;
  profile.themeVersion = theme.version;
  profile.themeCss = scopeThemeRoots(theme.css);
  const output = assertOutputRoot(resolve(root, out), root, { mustExist: false });
  if (fs.existsSync(output)) fail(`Output already exists: ${output}. Use dashboard:update for an existing dashboard; choose a new folder for scaffolding.`);
  const data = structuredClone(profile.example);
  const identity = data.site || data.profile;
  if (name !== undefined) identity.name = name;
  if (domain !== undefined) {
    if (typeof domain !== 'string' || !/^[a-z\d](?:[a-z\d.-]*[a-z\d])?$/i.test(domain)) fail('Domain must be a hostname without a scheme, path or port');
    identity.domain = domain;
    identity.url = `https://${domain}`;
  }
  const today = new Date().toISOString().slice(0, 10);
  identity.dataAsOf = today;
  if (Object.hasOwn(identity, 'asOf')) identity.asOf = today;
  validateData(data, profile);
  const meta = metadataFor(profile);
  let html = replaceEmbeddedData(profile.template, meta.scriptId, data, { marked: false });
  const headEnd = uniquePosition(html, '</head>');
  const generated = `${THEME_START}\n<style id="dashboard-theme">\n${profile.themeCss}\n</style>\n${THEME_END}\n` +
    `<script id="dashboard-provenance" type="application/json">\n${serializeJson(meta)}\n</script>\n`;
  html = html.slice(0, headEnd) + generated + html.slice(headEnd);
  const assetFolders = new Set([...html.matchAll(/\.\.\/\.\.\/docs\/images\/([a-zA-Z0-9_-]+)\//g)].map(match => match[1]));
  html = html.replaceAll('../../docs/images/', 'docs/images/');
  validateMetadata(meta, profile, html);
  // All content is validated before creating the output; an existing directory is never reused.
  fs.mkdirSync(dirname(output), { recursive: true });
  rejectLinks(dirname(output));
  fs.mkdirSync(output);
  fs.writeFileSync(join(output, 'data.json'), JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  fs.writeFileSync(join(output, 'dashboard.html'), html, { flag: 'wx', mode: 0o600 });
  fs.writeFileSync(join(output, '.dashboard-meta.json'), JSON.stringify(meta, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  fs.cpSync(join(root, 'themes'), join(output, 'themes'), { recursive: true, errorOnExist: true, force: false });
  for (const folder of assetFolders) {
    const source = join(root, 'docs', 'images', folder);
    if (fs.existsSync(source)) fs.cpSync(source, join(output, 'docs', 'images', folder), { recursive: true, errorOnExist: true, force: false });
  }
  return { output, htmlPath: join(output, 'dashboard.html'), profileId, metadata: meta };
}

function stageFile(path, bytes, io) {
  const fd = io.openSync(path, 'wx', 0o600);
  try { io.writeFileSync(fd, bytes); io.fsyncSync(fd); } finally { io.closeSync(fd); }
  if (!io.readFileSync(path).equals(Buffer.from(bytes))) fail('Staged output verification failed');
}

/** Rename is the sole publish point for HTML. A failed publish restores the previous backup. */
export function atomicDashboardWrite({ output, previous, next, io = fs }) {
  const target = outputFile(output, 'dashboard.html');
  const backup = outputFile(output, 'dashboard.html.bak', { optional: true });
  const nonce = randomUUID();
  const staged = join(output, `.dashboard-${nonce}.tmp`);
  const stagedBackup = join(output, `.dashboard-${nonce}.bak.tmp`);
  const oldBackup = join(output, `.dashboard-${nonce}.rollback.tmp`);
  const hadBackup = fs.existsSync(backup);
  let backupPublished = false;
  let committed = false;
  let preserveRollback = false;
  try {
    stageFile(staged, next, io);
    stageFile(stagedBackup, previous, io);
    if (hadBackup) stageFile(oldBackup, readBytes(backup, HTML_LIMIT), io);
    outputFile(output, 'dashboard.html');
    outputFile(output, 'dashboard.html.bak', { optional: true });
    if (!readBytes(target, HTML_LIMIT).equals(previous)) fail('Dashboard changed during update; retry after other edits finish');
    io.renameSync(stagedBackup, backup);
    backupPublished = true;
    io.renameSync(staged, target);
    committed = true;
  } catch (error) {
    if (backupPublished && !committed) {
      try {
        if (hadBackup) io.renameSync(oldBackup, backup);
        else io.unlinkSync(backup);
      } catch (rollbackError) {
        preserveRollback = true;
        throw new Error(`HTML is unchanged; backup rollback failed (${rollbackError.code || 'I/O error'}). Preserve ${oldBackup} for recovery.`, { cause: error });
      }
    }
    throw new Error(`Update was not published; last good HTML is unchanged (${error.message})`, { cause: error });
  } finally {
    for (const temporary of [staged, stagedBackup, ...(preserveRollback ? [] : [oldBackup])]) {
      try { io.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') console.error(`Could not remove temporary file ${temporary}: ${error.code}`); }
    }
  }
}

function withOutputLock(output, operation) {
  const lock = outputFile(output, '.dashboard-update.lock', { optional: true });
  let lockFd;
  try { lockFd = fs.openSync(lock, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') fail('Another update is running or left .dashboard-update.lock; confirm it stopped before removing that lock');
    throw error;
  }
  try {
    return operation();
  } finally {
    fs.closeSync(lockFd);
    fs.unlinkSync(lock);
  }
}

/** Read-only inspection is shared by CLI, editor and previews. Revision includes custom HTML edits. */
export function readDashboard({ out = 'my-dashboard', profileId, root = ROOT, allowInvalidData = false } = {}) {
  const output = assertOutputRoot(resolve(root, out), root);
  const metadataPath = outputFile(output, '.dashboard-meta.json');
  const dataPath = outputFile(output, 'data.json');
  const htmlPath = outputFile(output, 'dashboard.html');
  const backupPath = outputFile(output, 'dashboard.html.bak', { optional: true });
  const metaBytes = readBytes(metadataPath);
  const meta = parseStrictJson(decode(metaBytes, 'Metadata'), 'Metadata');
  if (profileId !== undefined && profileId !== meta.profileId) fail('Requested profile does not match dashboard metadata');
  const profile = loadProfile(meta.profileId, { root });
  const dataBytes = readBytes(dataPath);
  const dataText = decode(dataBytes, 'data.json');
  const previous = readBytes(htmlPath, HTML_LIMIT);
  const html = decode(previous, 'dashboard.html');
  validateMetadata(meta, profile, html);
  // Marker checks apply even when a caller wants to repair invalid data.json.
  replaceEmbeddedData(html, meta.scriptId, {});
  let data, validationError;
  try { data = validateData(parseStrictJson(dataText, 'data.json'), profile); }
  catch (error) { if (!allowInvalidData) throw error; validationError = error.message; }
  return {
    output, metadataPath, dataPath, htmlPath, metaBytes, meta, dataBytes, dataText, data, profile, html, previous,
    revision: hash(Buffer.concat([metaBytes, dataBytes, previous])), validationError, hasBackup: fs.existsSync(backupPath),
  };
}

export function updateDashboard({ out = 'my-dashboard', profileId, root = ROOT, io = fs } = {}) {
  const output = assertOutputRoot(resolve(root, out), root);
  return withOutputLock(output, () => {
    const state = readDashboard({ out: output, profileId, root });
    const next = Buffer.from(replaceEmbeddedData(state.html, state.meta.scriptId, state.data), 'utf8');
    if (next.equals(state.previous)) return { changed: false, output, htmlPath: state.htmlPath, profileId: state.profile.id };
    if (!fs.readFileSync(state.dataPath).equals(state.dataBytes) || !fs.readFileSync(state.metadataPath).equals(state.metaBytes)) fail('Data or metadata changed during update; retry');
    atomicDashboardWrite({ output, previous: state.previous, next, io });
    return { changed: true, output, htmlPath: state.htmlPath, profileId: state.profile.id };
  });
}

/** Editor save uses the updater lock and rolls data back if HTML publication fails. */
export function saveDashboard({ out, source, expectedRevision, root = ROOT, io = fs } = {}) {
  const output = assertOutputRoot(resolve(root, out), root);
  return withOutputLock(output, () => {
    const state = readDashboard({ out: output, root, allowInvalidData: true });
    if (expectedRevision !== state.revision) fail('Dashboard changed since it was loaded. Reload before saving to preserve external edits.');
    const data = validateData(parseStrictJson(source, 'Edited data'), state.profile);
    const next = Buffer.from(replaceEmbeddedData(state.html, state.meta.scriptId, data), 'utf8');
    const dataNext = Buffer.from(source, 'utf8');
    const htmlChanged = !next.equals(state.previous);
    const dataChanged = !dataNext.equals(state.dataBytes);
    if (!htmlChanged && !dataChanged) return { changed: false, ...state };
    const nonce = randomUUID();
    const staged = join(output, `.dashboard-data-${nonce}.tmp`);
    const rollback = join(output, `.dashboard-data-${nonce}.rollback.tmp`);
    let published = false, preserveRollback = false;
    try {
      stageFile(staged, dataNext, io);
      stageFile(rollback, state.dataBytes, io);
      if (readDashboard({ out: output, root, allowInvalidData: true }).revision !== state.revision) fail('Dashboard changed while saving; reload');
      io.renameSync(staged, state.dataPath);
      published = true;
      if (htmlChanged) atomicDashboardWrite({ output, previous: state.previous, next, io });
    } catch (error) {
      if (published) {
        try { io.renameSync(rollback, state.dataPath); }
        catch { preserveRollback = true; throw new Error(`Save failed; preserve ${rollback} to recover the previous data.json`, { cause: error }); }
      }
      throw error;
    } finally {
      for (const path of [staged, ...(preserveRollback ? [] : [rollback])]) {
        try { io.unlinkSync(path); } catch (error) { if (error.code !== 'ENOENT') console.error(`Could not remove temporary file: ${path}`); }
      }
    }
    return { changed: true, ...readDashboard({ out: output, root }) };
  });
}

export function backupData({ out, root = ROOT } = {}) {
  const state = readDashboard({ out, root, allowInvalidData: true });
  const backup = decode(readBytes(outputFile(state.output, 'dashboard.html.bak'), HTML_LIMIT), 'Dashboard backup');
  validateMetadata(state.meta, state.profile, backup);
  const region = scriptRegion(backup, state.meta.scriptId);
  const data = validateData(parseStrictJson(backup.slice(region.bodyStart, region.bodyEnd), 'Backup data'), state.profile);
  return JSON.stringify(data, null, 2) + '\n';
}
