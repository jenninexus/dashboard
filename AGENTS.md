# Dashboard — Agent & AI Assistant Guide

> A self-contained, themeable **dashboard seed kit**. Pick a **profile** (SEO, finances,
> health, or your own), drop in JSON, get a polished single-file dashboard. No build, no backend.
> Works with any AI agent (Claude, Copilot, Cursor, Gemini) or a plain `npm` command.
> *Last updated: 2026-07-28*

## What this repo is

- `profiles/` — what to track. Each profile ships a self-contained `{profile-id}.html` (the dashboard), an `example-data.json` (the data contract), and a `profile.json` (the manifest). All three profiles (`seo`, `finances`, `health`) are ready to scaffold.
- `themes/` — swap the whole look via one token block. Default per-profile theme; alternates included (`aurora-borealis`, `midnight-blue`, `plasma-green`).
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
| **health** | ✅ ready | habits · vitals · meds · labs · appointments | `profiles/health/example-data.json` |

Manifest fields (`profile.json`): `id, name, status, theme, render, exampleData, sections[]`.
All three profiles ship a full `{profile-id}.html` + `example-data.json`. To add a new
profile, copy the closest one (see [Profile system](docs/profile-system.md) → "Build your own profile").

## Theming

Each profile ships with its own per-profile palette (SEO = midnight/aurora, Finances = emerald/gold,
Health = teal/lavender). General-purpose alternates in `themes/`:

- `plasma-green.css` — default dark neon dashboard palette
- `aurora-borealis.css` — prismatic turquoise, purple, pink (+ `.effects.css` for shimmer)
- `midnight-blue.css` — cooler blue starter

To reskin a dashboard: copy a `themes/*.css` `:root` block into the `<style>` at the top of the
profile's `{profile-id}.html`. Tier-1 brand-service colors (`themes/seo-tokens.css`) are canonical
vendor values; don't change those.

## How to customize what's tracked (the point of the kit)

- **Add a metric:** add the field to the profile's `example-data.json` (with a `_comment`), then reference it in `{profile-id}.html`.
- **Add a chart:** drop a `<canvas id="x">` in a `.chart-container`, init `new Chart(...)` in the script block.
- **Add a section:** copy a card block, give it an id, wire its data.
- **New domain entirely:** copy `profiles/seo` → `profiles/<yours>`, edit the manifest + schema.

## Optional MCP

This repo no longer ships an MCP wiring. The dashboard is fully static and self-contained —
there's nothing for an MCP server to do here. If you want to wire an AI agent helper tool
of your own, do it in your fork; don't commit it back here.

## Private vs public

Designed for public release:
- No secrets in tracked files — all in `.env` (gitignored). `.env.example` has placeholders for optional API keys (SEO profile is hand-fed JSON by default).
- No hardcoded personal data in the seed — example profiles use fictional sample data (Stellar Digital, Alex Rivera, Jordan Lee).
- Per-user output (`my-dashboard/`) is gitignored.

Clone → `npm run build-dashboard -- --profile seo --name "You"` → edit `data.json` → done.