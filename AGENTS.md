# Dashboard — Agent & AI Assistant Guide

> A self-contained, themeable **dashboard seed kit**. Pick a **profile** (SEO, finances,
> health, or your own), drop in JSON, get a polished single-file dashboard. No build, no backend.
> Works with any AI agent (Claude, Copilot, Cursor, Gemini) or a plain `npm` command.
> *Last updated: 2026-06-14*

## What this repo is

- `dashboard.html` — the render shell. Self-contained: inline CSS (themed), inline Chart.js (CDN), works over `file://`.
- `profiles/` — what to track. `seo` + `finances` are ready (full `dashboard.html` + `example-data.json`); `health` is a planned stub (`profile.json` only). Each has a `profile.json` manifest.
- `themes/` — swap the whole look via one token block. Default **Plasma Green**. Alternates included (`aurora-borealis`, `midnight-blue`).
- `scripts/build-dashboard.mjs` — zero-dep scaffolder. Copies a profile + theme into `my-dashboard/` and stamps the user's name/site.

## The one thing to do for a user

When a user says *"set up a dashboard for X"*, **run the scaffolder** — don't hand-build:

```bash
npm run build-dashboard -- --profile seo --name "Their Brand" --domain theirsite.com
# or:  node scripts/build-dashboard.mjs --list
```

Then:
1. Open `my-dashboard/data.json` and fill in real numbers (every field has a `_comment`).
2. Open `my-dashboard/dashboard.html` in a browser.
3. Restyle if asked (see Theming).

## Profiles

| Profile | Status | Tracks | Data schema |
|---------|--------|--------|-------------|
| **seo** | ✅ ready | GA4 · Search Console · PageSpeed · Cloudflare | `profiles/seo/example-data.json` |
| **finances** | ✅ ready | cash vs obligations · bills · loans · income | `profiles/finances/example-data.json` |
| health | 🚧 planned | custom metrics · trends · habits · labs | `profiles/health/` (stub) |

Manifest fields (`profile.json`): `id, name, status, theme, render, exampleData, sections[]`.
`seo` + `finances` ship a full `dashboard.html` + `example-data.json`; `health` is a stub
(profile.json only). To build out a planned profile, see `profiles/README.md` → "Add your own profile".

## Theming

Default is **Plasma Green** (inlined in `dashboard.html`). To reskin: copy a `themes/*.css`
block into the `<style>` at the top of `dashboard.html`, or `<link>` it when served over HTTP.
The root README has the public theme overview. Tier-1 brand-service colors
(`themes/seo-tokens.css`) are canonical vendor values; don't change those.

## How to customize what's tracked (the point of the kit)

- **Add a metric:** add the field to the profile's `example-data.json` (with a `_comment`), then reference it in `dashboard.html`.
- **Add a chart:** drop a `<canvas id="x">` in a `.chart-container`, init `new Chart(...)` in the script block.
- **Add a section:** copy a card block, give it an id, wire its data.
- **New domain entirely:** copy `profiles/seo` → `profiles/<yours>`, edit the manifest + schema.

## Skills / commands (Claude Code & compatible)

| Skill | Purpose |
|-------|---------|
| `/build-dashboard` | Scaffold + customize a dashboard from a profile (see `.claude/commands/build-dashboard.md`) |
| `/ap` | Surface the Action Plan / action items the dashboard tracks |
| `/work-start` | Open + refresh the dashboard at session start |

These are optional conveniences — the repo works without any agent via `npm run build-dashboard`.

## Optional MCP

Copy `.mcp.json.example` → `.mcp.json` to wire a sys-admin MCP server (for emailing reports,
backing up to Drive, or logging metrics to a sheet). Entirely optional — the dashboard is
static and needs no server. Env var names: `.env.example`.

## Private vs public

Designed for public release:
- No secrets in tracked files — all in `.env` (gitignored). `.env.example` has placeholders.
- No hardcoded personal data in the seed — example profiles use fictional sample data.
- Per-user output (`my-dashboard/`) is gitignored.

Clone → `npm run build-dashboard -- --profile seo --name "You"` → edit `data.json` → done.
