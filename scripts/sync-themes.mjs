#!/usr/bin/env node
/**
 * sync-themes.mjs — (OPTIONAL maintainer tool) regenerate dashboard theme CSS
 * from the shared theme kit's palette registry.
 *
 * ⚠️ YOU DO NOT NEED THIS TO USE THE SEED. The themes in themes/*.css are already
 * committed, so the dashboard is fully self-contained. This script only matters if
 * you maintain the upstream palette source and want to re-derive the theme CSS.
 *
 * Source of truth: the theme kit's dashboard-palettes.json (a private dev kit;
 * see themes/SOURCES.md). Maps each palette's colors → this seed's Tier-2 token
 * contract (themes/README.md) and writes themes/<key>.css.
 *
 *   node scripts/sync-themes.mjs                  # regenerate all mapped themes
 *   node scripts/sync-themes.mjs aurora-borealis  # just one
 *   node scripts/sync-themes.mjs --list           # list available source palettes
 *
 * Point it at your kit with the THEME_KIT_PALETTES env var if it isn't a sibling repo:
 *   THEME_KIT_PALETTES=/path/to/dashboard-palettes.json node scripts/sync-themes.mjs
 *
 * Skips non-kit themes (midnight-blue.css) and Tier-1 vendor tokens (seo-tokens.css).
 * Zero deps. After syncing, inline the block into a dashboard or <link> it (see README).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED = path.join(__dirname, '..');
const THEMES = path.join(SEED, 'themes');

// The palette source lives in the (private) theme kit. Resolution order:
//   1. THEME_KIT_PALETTES env var (explicit path)
//   2. a sibling ../www-theme-kit checkout (maintainer's local layout)
const KIT_CANDIDATES = [
  process.env.THEME_KIT_PALETTES,
  path.join(SEED, '..', 'www-theme-kit', 'tokens', 'dashboard-palettes.json'),
].filter(Boolean);
const kitPath = KIT_CANDIDATES.find(p => fs.existsSync(p));
if (!kitPath) {
  console.error([
    'Theme-kit palette source not found — nothing to sync.',
    '',
    'This is a MAINTAINER tool and is OPTIONAL: the dashboard works without it',
    'because themes/*.css are already committed.',
    '',
    'If you do maintain the kit, point this at its dashboard-palettes.json:',
    '  THEME_KIT_PALETTES=/path/to/dashboard-palettes.json node scripts/sync-themes.mjs',
  ].join('\n'));
  process.exit(1);
}
const kit = JSON.parse(fs.readFileSync(kitPath, 'utf8'));
const palettes = kit.palettes || kit;

// Manifest: which theme files are kit-derived (others are left alone).
const MAPPED = {
  'plasma-green':    'plasma-green.css',
  'aurora-borealis': 'aurora-borealis.css',
};

const args = process.argv.slice(2);
if (args[0] === '--list') {
  console.log('Source palettes in', path.relative(SEED, kitPath) + ':\n');
  for (const [k, v] of Object.entries(palettes)) {
    const mapped = MAPPED[k] ? `→ themes/${MAPPED[k]}` : '(not mapped)';
    console.log(`  ${k.padEnd(18)} ${(v.name||'').padEnd(26)} ${mapped}`);
  }
  process.exit(0);
}

const hexToRgb = h => {
  const m = h.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16));
  return m.join(',');
};

// Map a www dashboard palette → this seed's Tier-2 token contract.
function toThemeCss(key, p) {
  const c = p.colors || {};
  const primary = c.purple || c.cyan || '#00e879';        // "purple" slot = primary accent in www form
  const bg = p.background || '#08060e';
  const glow = p.glow || primary;
  // Derive a slightly-lighter bg2 by mixing toward white (cheap, deterministic).
  const lighten = (hex, amt) => {
    const [r, g, b] = hex.replace('#','').match(/.{2}/g).map(x => parseInt(x,16));
    const f = v => Math.min(255, Math.round(v + (255 - v) * amt)).toString(16).padStart(2,'0');
    return `#${f(r)}${f(g)}${f(b)}`;
  };
  return `/* ============================================================
   ${p.name} — dashboard theme (AUTO-GENERATED)
   Source: www-theme-kit/tokens/dashboard-palettes.json → "${key}"
   Regenerate: node scripts/sync-themes.mjs ${key}
   Do NOT hand-edit colors here — edit the source palette in www-theme-kit.
   ============================================================ */
:root {
  --bg:        ${bg};
  --bg2:       ${lighten(bg, 0.06)};
  --surface:   rgba(${hexToRgb(primary)},0.05);
  --surface2:  rgba(${hexToRgb(primary)},0.08);
  --border:    rgba(${hexToRgb(primary)},0.14);
  --border2:   rgba(${hexToRgb(primary)},0.30);
  --text:      #f0e8ff;
  --dim:       #b3a3d4;
  --dim2:      #6f6090;
  --bright:    #ffffff;

  --primary:     ${primary};
  --primary-rgb: ${hexToRgb(primary)};
  --secondary:   ${c.cyan || c.teal || primary};
  --accent:      ${c.pink || c.teal || primary};
  --blue:        ${c.blue || c.cyan || primary};
  --teal:        ${c.teal || c.cyan || primary};
  --indigo:      ${c.indigo || primary};
  --red:         ${c.pink || '#e5195f'};
  --yellow:      #fcd34d;
  --green:       ${c.teal || c.cyan || primary};
  --glow:        rgba(${hexToRgb(glow)},0.16);

  --card-radius: 14px;
  --blur:        20px;
  --mono:        'JetBrains Mono','Cascadia Code',monospace;
  --sans:        'Outfit','Segoe UI',system-ui,sans-serif;
  --heading:     'Orbitron','Outfit',system-ui,sans-serif;
}
`;
}

const targets = args.length ? args : Object.keys(MAPPED);
let wrote = 0;
for (const key of targets) {
  if (!MAPPED[key]) { console.warn(`skip "${key}" — not in manifest (see themes/SOURCES.md)`); continue; }
  const p = palettes[key];
  if (!p) { console.warn(`skip "${key}" — not found in ${path.basename(kitPath)}`); continue; }
  const out = path.join(THEMES, MAPPED[key]);
  fs.writeFileSync(out, toThemeCss(key, p));
  console.log(`✓ ${key.padEnd(18)} -> themes/${MAPPED[key]}`);
  wrote++;
}
console.log(`\nDone. Regenerated ${wrote} theme(s) from ${path.basename(kitPath)}.`);
console.log('Inline the :root block into a dashboard, or <link> the file (see themes/README.md).');
