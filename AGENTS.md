# Dashboard — Agent & AI Assistant Guide

> A self-contained, themeable **dashboard seed kit**. Pick a **profile** (SEO, finances,
> health, pets, or your own), drop in JSON, get a polished single-file dashboard. No build, no backend.
> Works with any AI agent (Claude, Copilot, Cursor, Gemini) or a plain `npm` command.
> *Last updated: 2026-08-18*

## What this repo is

- `profiles/` — what to track. Each profile ships `{profile-id}.html`, `example-data.json`, and `profile.json`.
- `themes/` — swap the look via one token block. Per-profile themes plus alternates.
- `scripts/build-dashboard.mjs` — zero-dep scaffolder. Copies a profile + themes into `my-dashboard/`.

## The one thing to do for a user

When a user says *"set up a dashboard for X"*, **run the scaffolder** — don't hand-build:

```bash
npm run build-dashboard -- --profile seo --name "Their Brand" --domain theirsite.com
# or:  node scripts/build-dashboard.mjs --list
```

Then:
1. Open `my-dashboard/data.json` and fill in real numbers.
2. Open `my-dashboard/dashboard.html` in a browser.
3. Restyle if asked (see Theming).

## Profiles

| Profile | Status | Tracks | Theme id |
|---------|--------|--------|----------|
| **seo** | ✅ ready | GA4 · Search Console · PageSpeed · Cloudflare | `aurora-seo` |
| **finances** | ✅ ready | cash vs obligations · bills · loans · income | `emerald-finance` |
| **health** | ✅ ready | vitals · meds · labs · habits · sleep | `vitality-health` |
| **pets** | ✅ ready | weight · QoL · fluids · red flags | `dusk-companion` |

Manifest fields: `id, name, status, theme, render, exampleData, dataInjection.scriptId, sections[]`.
`render` is a **repo-root path** to `{id}.html`. There is no root `dashboard.html`.

## Theming

Per-profile palettes stay distinct. Shared chrome is collapse, radii, and breakpoints — not one accent for all.

- `aurora-seo.css` — SEO
- `emerald-finance.css` — Finances
- `vitality-health.css` — Health
- `dusk-companion.css` — Pets (pink dusk / rose `#f472b6`, not brown/amber)
- Alternates: `plasma-green.css`, `aurora-borealis.css`, `midnight-blue.css`

**Name collision:** `plasma-green` (`#00e879`) ≠ Synagraphic **Plasma Drift** (`#e050a0`).

`midnight-blue.css` keeps `#6C8EFF` on purpose (original seed look). Kit `midnight-depths` glow is `#818cf8`.

Tier-1 vendor colors (`themes/seo-tokens.css`) are canonical — don't change those.

## Sister repos (do not merge)

| Repo | Job |
|---|---|
| [jenninexus/fin](https://github.com/jenninexus/fin) | Operational finance workspace seed |
| [jenninexus/senior-pet-care](https://github.com/jenninexus/senior-pet-care) | Printable Markdown pet tracker |
| `D:\Documents\Finances` | Household production dashboard — **LOCAL ONLY** |

## Scaffolder traps (2026-08-17)

- `profile.render` must exist on disk (`profiles/<id>/<id>.html`). Old manifests pointed at a missing root `dashboard.html` and the scaffolder died with ENOENT.
- Always set `dataInjection.scriptId` to the inline script the HTML parses (`seo-data`, `fin-data`, `health-data`, `pets-data`).
- After changing the HTML inline JSON, copy it to `example-data.json` so scaffold injection matches the renderer.

## Optional MCP

This repo no longer ships an MCP wiring. The dashboard is fully static.

## Private vs public

⭐ Full map: [`docs/PUBLIC-LOCAL-SPLIT.md`](docs/PUBLIC-LOCAL-SPLIT.md)

- No secrets in tracked files.
- Example profiles use fictional data (Stellar Digital, Alex Rivera, Jordan Lee, Miso).
- `my-dashboard/` is gitignored.
- Brand tokens for production dashes may come from private **www-theme-kit** — copy into `themes/`; not a public dependency.

Clone → `npm run build-dashboard -- --profile seo --name "You"` → edit `data.json` → done.
