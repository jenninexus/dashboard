import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import {
  ROOT, LIMITS, loadProfile, loadThemes, assertOutputRoot, scaffoldDashboard, readDashboard,
  updateDashboard, saveDashboard, backupData, parseStrictJson, validateData, replaceEmbeddedData,
} from '../lib/dashboard-core.mjs';

const WEB = dirname(fileURLToPath(import.meta.url));
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);
const routes = {
  '/api/select': ['path'], '/api/scaffold': ['profileId', 'themeId', 'name', 'domain'],
  '/api/validate': ['source'], '/api/preview': ['source'], '/api/save': ['source', 'revision'],
  '/api/update': [], '/api/restore': ['revision'], '/api/stop': [],
};
const error = (status, message) => Object.assign(new Error(message), { status });

function publicState(state, selectionId) {
  return {
    output: state.output, profileId: state.profile.id, source: state.dataText, data: state.data ?? null,
    schema: state.profile.editorSchema, example: state.profile.example, revision: state.revision,
    themeId: state.meta.theme.id, hasBackup: state.hasBackup, validationError: state.validationError ?? null,
    selectionId,
  };
}

async function bodyJson(request, maximum) {
  if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers['content-type'] || '')) throw error(415, 'Content-Type must be application/json');
  const length = request.headers['content-length'];
  if (length !== undefined && (!/^\d+$/.test(length) || Number(length) > maximum)) throw error(413, 'Request exceeds the JSON size limit');
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximum) throw error(413, 'Request exceeds the JSON size limit');
    chunks.push(chunk);
  }
  let source;
  try { source = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)); }
  catch { throw error(400, 'Request must be valid UTF-8'); }
  // A JSON document travels as a string so duplicate keys inside it remain detectable by the core.
  const body = parseStrictJson(source, 'Request', { ...LIMITS, bytes: maximum, string: LIMITS.bytes });
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw error(400, 'Request body must be an object');
  return body;
}

export async function startWizard({ root = ROOT, out = 'my-dashboard', port = 0, idleMs = 20 * 60 * 1000, maximumBody = LIMITS.bytes } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be an integer between 0 and 65535');
  if (!Number.isFinite(idleMs) || idleMs < 20) throw new Error('Idle timeout must be at least 20ms');
  const token = randomBytes(32).toString('hex');
  const initialPath = assertOutputRoot(resolve(root, out), root, { mustExist: false });
  const selectionFor = output => Object.freeze({ output, id: randomBytes(24).toString('hex') });
  let selected = existsSync(join(initialPath, '.dashboard-meta.json')) ? selectionFor(initialPath) : null;
  let origin, lastActivity = Date.now(), stopping = false, stopPromise;
  const previews = new Map();
  const sockets = new Set();
  const touch = () => { lastActivity = Date.now(); };
  const state = (selection = selected) => {
    if (!selection) throw error(409, 'Choose a dashboard folder first');
    return readDashboard({ out: selection.output, root, allowInvalidData: true });
  };
  const send = (response, status, value, type = 'application/json; charset=utf-8') => {
    response.statusCode = status;
    response.setHeader('Content-Type', type);
    response.end(type.startsWith('application/json') ? JSON.stringify(value) : value);
  };
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    try {
      if (stopping) throw error(503, 'Editor is stopping');
      if (request.headers.host !== origin.slice('http://'.length)) throw error(403, 'Unexpected Host');
      if (request.headers.origin && request.headers.origin !== origin) throw error(403, 'Unexpected Origin');
      if (request.headers['sec-fetch-site'] === 'cross-site') throw error(403, 'Cross-site requests are not allowed');
      const path = request.url;
      if (!path || path.includes('?') || path.includes('#') || path.includes('%') || path.includes('\\')) throw error(404, 'Unknown route');
      if (assets.has(path)) {
        if (request.method !== 'GET') throw error(405, 'Only GET is allowed for editor assets');
        const [filename, type] = assets.get(path);
        send(response, 200, readFileSync(join(WEB, filename)), type);
        return;
      }
      if (/^\/preview\/[a-f0-9]{48}$/.test(path)) {
        if (request.method !== 'GET') throw error(405, 'Only GET is allowed for preview');
        const preview = previews.get(path);
        if (!preview || preview.expires < Date.now()) throw error(404, 'Preview expired; generate it again');
        response.setHeader('Content-Security-Policy', "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'");
        send(response, 200, preview.html, 'text/html; charset=utf-8');
        return;
      }
      if (!path.startsWith('/api/')) throw error(404, 'Unknown route');
      const supplied = request.headers['x-dashboard-token'];
      if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) throw error(403, 'Invalid editor capability token');
      if (['/api/catalog', '/api/state', '/api/export', '/api/ping'].includes(path)) {
        if (request.method !== 'GET') throw error(405, 'This route requires GET');
        touch();
        if (path === '/api/ping') send(response, 200, { active: true });
        else if (path === '/api/catalog') {
          const profiles = readdirSync(join(root, 'profiles'), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => loadProfile(entry.name, { root })).map(profile => ({ id: profile.id, name: profile.name, description: profile.description, theme: profile.theme }));
          const themes = loadThemes({ root }).map(({ css, ...theme }) => theme);
          send(response, 200, { profiles, themes, initialPath, state: selected ? publicState(state(), selected.id) : null, idleMinutes: idleMs / 60000 });
        } else if (path === '/api/state') send(response, 200, publicState(state(), selected.id));
        else {
          if (!selected || request.headers['x-dashboard-selection'] !== selected.id) throw error(409, 'Dashboard selection changed; reload or choose the folder again');
          response.setHeader('Content-Disposition', 'attachment; filename="data.json"');
          send(response, 200, state().dataText, 'text/plain; charset=utf-8');
        }
        return;
      }
      if (!Object.hasOwn(routes, path)) throw error(404, 'Unknown API route');
      if (request.method !== 'POST') throw error(405, 'Write operations require POST');
      if (request.headers.origin !== origin) throw error(403, 'Write operations require this editor Origin');
      // Capture the selected folder before awaiting any request-body bytes. The nonce
      // also protects a stale tab whose request begins after another tab switched folders.
      const selection = selected;
      const selectionBound = !['/api/select', '/api/stop'].includes(path);
      if (selectionBound && (!selection || request.headers['x-dashboard-selection'] !== selection.id)) {
        throw error(409, 'Dashboard selection changed; reload or choose the folder again');
      }
      const body = await bodyJson(request, maximumBody);
      if (path !== '/api/stop' && selection !== selected) throw error(409, 'Dashboard selection changed while the request was arriving; reload or choose the folder again');
      for (const key of Object.keys(body)) if (!routes[path].includes(key)) throw error(400, `Unexpected field: ${key}`);
      touch();
      if (path === '/api/stop') {
        response.once('finish', () => { void stop(); });
        send(response, 200, { stopped: true });
      } else if (path === '/api/select') {
        if (typeof body.path !== 'string' || !body.path.trim()) throw error(400, 'Enter an explicit output folder');
        const output = assertOutputRoot(resolve(root, body.path), root, { mustExist: false });
        // Validate an existing folder before changing the selection; failed selection retains the prior root.
        const existing = existsSync(output) ? readDashboard({ out: output, root, allowInvalidData: true }) : null;
        selected = selectionFor(output);
        previews.clear();
        send(response, 200, { output, exists: Boolean(existing), selectionId: selected.id, state: existing ? publicState(existing, selected.id) : null });
      } else if (path === '/api/scaffold') {
        scaffoldDashboard({ ...body, out: selection.output, root });
        send(response, 201, publicState(state(selection), selection.id));
      } else if (path === '/api/update') {
        state(selection);
        const result = updateDashboard({ out: selection.output, root });
        send(response, 200, { ...publicState(state(selection), selection.id), changed: result.changed });
      } else if (path === '/api/restore') {
        state(selection);
        const result = saveDashboard({ out: selection.output, root, source: backupData({ out: selection.output, root }), expectedRevision: body.revision });
        send(response, 200, { ...publicState(result, selection.id), changed: result.changed });
      } else {
        const current = state(selection);
        if (typeof body.source !== 'string') throw error(400, 'Source must be JSON text');
        const data = validateData(parseStrictJson(body.source, 'Edited data'), current.profile);
        if (path === '/api/validate') send(response, 200, { valid: true, data });
        else if (path === '/api/save') {
          const result = saveDashboard({ out: selection.output, root, source: body.source, expectedRevision: body.revision });
          send(response, 200, { ...publicState(result, selection.id), changed: result.changed });
        } else {
          const url = `/preview/${randomBytes(24).toString('hex')}`;
          if (previews.size >= 3) previews.delete(previews.keys().next().value);
          previews.set(url, { html: replaceEmbeddedData(current.html, current.meta.scriptId, data), expires: Date.now() + 300000 });
          send(response, 200, { url });
        }
      }
    } catch (failure) {
      if (!response.headersSent) send(response, failure.status || 400, { error: failure.message });
      else response.destroy();
    }
  });
  server.maxHeadersCount = 32;
  server.requestTimeout = 10000;
  server.headersTimeout = 5000;
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => { server.off('error', reject); done(); });
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  const idleTimer = setInterval(() => { if (Date.now() - lastActivity >= idleMs) void stop(); }, Math.min(1000, idleMs));
  const closed = new Promise(done => server.once('close', done));
  function stop() {
    if (stopPromise) return stopPromise;
    stopping = true;
    clearInterval(idleTimer);
    previews.clear();
    stopPromise = new Promise((done, reject) => {
      server.close(error => error ? reject(error) : done());
      // End idle keep-alive and partial-request connections so Stop always releases the listener.
      for (const socket of sockets) socket.end();
      const deadline = setTimeout(() => { for (const socket of sockets) socket.destroy(); }, 100);
      deadline.unref();
    });
    return stopPromise;
  }
  return { origin, url: `${origin}/#${token}`, token, port: server.address().port, stop, closed, server };
}
