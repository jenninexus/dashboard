# Dashboard — Agent & AI Assistant Guide

> A self-contained, themeable **dashboard seed kit**. Pick a **profile** (SEO, finances,
> health, pets, or your own), drop in JSON, get a polished single-file dashboard. No build, no backend.
> Works with any AI agent (Claude, Copilot, Cursor, Gemini) or a plain `npm` command.
> *Last updated: 2026-09-26*

## What this repo is

- `profiles/` — what to track. Each profile ships `{profile-id}.html`, `example-data.json`,
  `profile.json`, and a compact versioned `editor-schema.json`.
- `themes/` — swap the look via one token block. Per-profile themes plus alternates.
- `scripts/build-dashboard.mjs` — zero-dep scaffolder. Copies a profile + themes into `my-dashboard/`.
- `Dashboard.cmd` / `npm run dashboard` — temporary loopback wizard over the same core.

## The one thing to do for a user

When a user says *"set up a dashboard for X"*, use the local wizard or **run the scaffolder** —
don't hand-build:

```bash
npm run build-dashboard -- --profile seo --name "Their Brand" --domain theirsite.com
# or:  node scripts/build-dashboard.mjs --list
```

Then:
1. Open `my-dashboard/data.json` and fill in real numbers.
2. Run `npm run dashboard:update` so the validated JSON is safely embedded in the existing HTML.
3. Open `my-dashboard/dashboard.html` in a browser.
4. Restyle if asked (see Theming).

## Local planning and agent state

This public repository does **not** use root `dev-chat.md` or `dev-log.yaml` files. Local execution
plans live in ignored `Plans/_active/` and move to ignored `Plans/_complete/` when finished. Promote
anything users or contributors must know into `AGENTS.md`, `README.md`, or `docs/` before completing
the plan. `.codex/`, `.claude/`, `_scratch/`, generated dashboards, and QA evidence are local-only.
The single tracked exception is `.claude/commands.example/` (`*.md.example` command templates users copy
into their own ignored `.claude/commands/`, dropping the suffix — the suffix keeps them out of every
assistant's live command list); never commit a live `.claude/commands/` folder here.

## Profiles

| Profile | Status | Tracks | Theme id |
|---------|--------|--------|----------|
| **seo** | ✅ ready | GA4 · Search Console · PageSpeed · Cloudflare | `aurora-seo` |
| **finances** | ✅ ready | cash vs obligations · bills · autopay escalation · deadlines · payment history · action plan · loans · income | `emerald-finance` |
| **health** | ✅ ready | vitals · meds · labs · habits · sleep | `vitality-health` |
| **pets** | ✅ ready | weight · QoL · fluids · red flags | `dusk-companion` |

Manifest fields include `id, name, status, theme, render, exampleData, editorSchema,
dataContractVersion, dataInjection.scriptId, sections[]`.
`render` is a **repo-root path** to `{id}.html`. There is no root `dashboard.html`.

## Theming

Per-profile palettes stay distinct. Shared chrome is collapse, radii, and breakpoints — not one accent for all.
`themes/manifest.json` is the public theme catalog and compatibility authority used by the wizard.

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
| [jenninexus/senior-pet-care](https://github.com/jenninexus/senior-pet-care) | Printable Markdown pet tracker |
| Local household workspace | Household production dashboard — **LOCAL ONLY; never copy into this repo** |

## Scaffolder and updater traps

- `profile.render` must exist on disk (`profiles/<id>/<id>.html`). Old manifests pointed at a missing root `dashboard.html` and the scaffolder died with ENOENT.
- Always set `dataInjection.scriptId` to the inline script the HTML parses (`seo-data`, `fin-data`, `health-data`, `pets-data`).
- Tracked profile HTML inline JSON and `example-data.json` must stay identical. Generated dashboards
  are updated from their local `data.json` through `npm run dashboard:update`.
- Profile HTML runtime-image paths are repo-relative (`../../docs/images/...`). The scaffolder copies
  referenced, existing folders into `my-dashboard/docs/images/` and rewrites those paths for the
  generated location. Pets currently ships the only runtime artwork.
- Do not leave speculative image references in profile HTML. Runtime images must exist under
  `docs/images/`, be referenced by a profile, and be copied by the scaffolder; the current pets
  profile is the only profile with bundled runtime artwork.

## Public media

- `docs/screenshots/hero/` contains the curated four-image README gallery.
- Full breakpoint sweeps are local QA evidence and stay ignored outside the hero folder.
- `docs/images/` contains runtime assets used by profile HTML and copied into generated dashboards;
  it is not a general screenshot dump.
- Public files must not contain machine-specific absolute paths, real user data, private kit paths,
  agent-runtime state, or generated output.

## Optional MCP

This repo no longer ships an MCP wiring. The dashboard is fully static.

## Private vs public

⭐ Full map: [`docs/PUBLIC-LOCAL-SPLIT.md`](docs/PUBLIC-LOCAL-SPLIT.md)

- No secrets in tracked files.
- Example profiles use fictional data (Stellar Digital, Alex Rivera, Jordan Lee, Miso).
- `my-dashboard/` is gitignored.
- Brand tokens may be vendored from a private authoring kit, but committed `themes/` files are the
  complete public contract and the product has no private runtime dependency.

Clone → scaffold or launch the local wizard → edit `data.json` → run `npm run dashboard:update` → open
the generated `dashboard.html`.
