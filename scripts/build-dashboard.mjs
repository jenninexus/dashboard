#!/usr/bin/env node
/**
 * build-dashboard.mjs — scaffold a customized dashboard from a profile.
 * Zero dependencies (Node 18+). Works for humans and AI agents alike.
 *
 *   node scripts/build-dashboard.mjs --profile seo --name "Acme Studio" --domain acme.com
 *   npm run build-dashboard -- --profile seo --name "Acme Studio"
 *   node scripts/build-dashboard.mjs --list
 *
 * What it does:
 *   1. Validates the profile exists and is `ready`.
 *   2. Creates ./my-dashboard/ (or --out <dir>).
 *   3. Copies the profile's example-data.json → my-dashboard/data.json, stamping
 *      site name / domain / dataAsOf where present.
 *   4. Copies dashboard.html + themes/ into my-dashboard/ so it's self-contained.
 *   5. Prints next steps.
 *
 * It never overwrites an existing --out dir unless --force is given.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));

function parseArgs(a) {
  const o = { _: [] };
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith('--')) { const k = a[i].slice(2); const v = (a[i+1] && !a[i+1].startsWith('--')) ? a[++i] : true; o[k] = v; }
    else o._.push(a[i]);
  }
  return o;
}
function listProfiles() {
  const dir = join(ROOT, 'profiles');
  return readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory())
    .map(d => { try { return JSON.parse(readFileSync(join(dir, d.name, 'profile.json'), 'utf8')); } catch { return null; } })
    .filter(Boolean);
}
function die(msg) { console.error('✗ ' + msg); process.exit(1); }

// --list
if (args.list) {
  console.log('\nAvailable profiles:\n');
  for (const p of listProfiles()) {
    const mark = p.status === 'ready' ? '✅' : '🚧';
    console.log(`  ${mark} ${p.id.padEnd(10)} ${p.name} — ${p.status}`);
    console.log(`     ${p.description}\n`);
  }
  console.log('Usage: node scripts/build-dashboard.mjs --profile <id> --name "Your Name" [--domain x.com] [--out my-dashboard]\n');
  process.exit(0);
}

const profileId = args.profile;
if (!profileId) die('Missing --profile. Run with --list to see options.');

const profDir = join(ROOT, 'profiles', profileId);
if (!existsSync(join(profDir, 'profile.json'))) die(`Profile "${profileId}" not found. Run --list.`);
const profile = JSON.parse(readFileSync(join(profDir, 'profile.json'), 'utf8'));

if (profile.status !== 'ready') {
  console.warn(`⚠ Profile "${profileId}" is "${profile.status}" — not built out yet. Scaffolding anyway with stub data.`);
}

const outDir = join(ROOT, args.out || 'my-dashboard');
if (existsSync(outDir) && !args.force) die(`Output dir already exists: ${outDir}  (use --force to overwrite)`);
mkdirSync(outDir, { recursive: true });

// 1. data.json — copy example data, stamp identity (shape-agnostic: site{} or profile{})
const exPath = join(profDir, profile.exampleData || 'example-data.json');
const today = new Date().toISOString().slice(0, 10);
let data = existsSync(exPath) ? JSON.parse(stripJsonComments(readFileSync(exPath, 'utf8'))) : {};
const ident = data.site ? 'site' : (data.profile ? 'profile' : 'site');
data[ident] = data[ident] || {};
if (args.name)   data[ident].name = args.name;
if (args.domain) { data[ident].domain = args.domain; data[ident].url = data[ident].url || `https://${args.domain}`; }
data[ident].dataAsOf = today; data[ident].asOf = today;
writeFileSync(join(outDir, 'data.json'), JSON.stringify(data, null, 2));

// 2. self-contained copy of the render + themes
let renderHtml = readFileSync(join(ROOT, profile.render || 'dashboard.html'), 'utf8');
// Data-driven renders embed an inline <script id="..."> JSON block — swap it with the user's data.
const sid = profile.dataInjection && profile.dataInjection.scriptId;
if (sid) {
  const re = new RegExp(`(<script id="${sid}"[^>]*>)([\\s\\S]*?)(</script>)`);
  if (re.test(renderHtml)) renderHtml = renderHtml.replace(re, `$1\n${JSON.stringify(data, null, 2)}\n$3`);
}
writeFileSync(join(outDir, 'dashboard.html'), renderHtml);
cpSync(join(ROOT, 'themes'), join(outDir, 'themes'), { recursive: true });

// 3. done
console.log(`\n✅ Scaffolded "${profile.name}" dashboard → ${outDir}\n`);
console.log('Next steps:');
console.log(`  1. Edit ${join(outDir, 'data.json')} — fill in your real numbers.`);
console.log(`  2. Open ${join(outDir, 'dashboard.html')} in a browser.`);
console.log(`  3. (Optional) Theme: copy a themes/*.css block into dashboard.html, or ask an AI agent to restyle.`);
if (profile.status !== 'ready') console.log(`\n  Note: this profile is "${profile.status}" — sections may be stubs. See profiles/${profileId}/profile.json.`);
console.log('');

// Minimal JSONC stripper (line + block comments, trailing commas) for example files
function stripJsonComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/,(\s*[}\]])/g, '$1');
}
