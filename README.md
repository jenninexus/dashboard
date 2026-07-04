<div align="center">

# Dashboard

![MIT](https://img.shields.io/badge/license-MIT-00e879?style=flat-square)
![Runtime](https://img.shields.io/badge/runtime-static%20HTML-42f4c8?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-zero--deps-39ff8c?style=flat-square)
![Mode](https://img.shields.io/badge/mode-local--first-00e5ff?style=flat-square)

## Make one dashboard.
## For everyone.

`dashboard` is a profile-based, local-first seed for quick, private, custom dashboards.
Pick a domain (`SEO`, `finances`, `health`), open the profile HTML, and get a polished single-file dashboard in seconds.

</div>

- No server needed — open from `file://` or deploy static.
- Profiles drive what you track.
- Themes drive how it looks.
- Assistant-friendly scaffold flow.

---

## Who is this for?

- Makers who want a clean starting point instead of building from zero.
- People who want to track one area deeply, then share it with others.
- Solo builders and small teams who like local-first, editable dashboards.

---

## Quick Start

```bash
git clone https://github.com/jenninexus/dashboard.git
cd dashboard
```

Then open one of the three profile HTMLs directly in your browser:

| Profile | Open this file |
|---|---|
| SEO | `profiles/seo/seo.html` |
| Finances | `profiles/finances/finances.html` |
| Health | `profiles/health/health.html` |

No build step required. No runtime dependencies.

---

## Profiles

Each profile is a self-contained dashboard for a specific domain. Open the HTML file directly from `file://` or serve it statically.

- **SEO** → `profiles/seo/seo.html` — Aurora SEO theme (midnight blue / aurora). Tracks GA4, Search Console, PageSpeed, and Cloudflare.
- **Finances** → `profiles/finances/finances.html` — Emerald Finance theme (emerald / gold). Tracks cash vs obligations, bills, loans, and income.
- **Health** → `profiles/health/health.html` — Vitality Health theme (teal / lavender). Tracks habits, labs, sleep, and appointments.

Edit the accompanying `data.json` in each profile folder to populate your own numbers, then refresh.

---

## Themes

Palettes live in `themes/` and can be copied into a dashboard's `<style>` block or linked when served over HTTP.

The palette direction is inspired by the workspace themes in [jenninexus/syn-themes](https://github.com/jenninexus/syn-themes).

Included palettes:

- `plasma-green.css` — default dark neon dashboard palette
- `aurora-borealis.css` — prismatic turquoise, purple, and pink
- `midnight-blue.css` — cooler blue dashboard starter
- `aurora-seo.css` — midnight blue / aurora blend used by the SEO profile
- `emerald-finance.css` — emerald and gold palette used by the Finances profile
- `vitality-health.css` — teal and lavender palette used by the Health profile
- `aurora-borealis.effects.css` — optional shimmer effects for the aurora palette

---

## Tech stack

- **Plain HTML/CSS/JS** — each profile is a single self-contained `.html` file (inline `<style>` + inline `<script>`). No framework, no bundler, no build step.
- **[Chart.js](https://www.chartjs.org/)** (via CDN `<script>` tag) — renders trend lines, doughnuts, and gauges inside each dashboard.
- **Google Fonts** (`Outfit`, `JetBrains Mono`, via `<link>` `preconnect`) — the only external network calls a dashboard makes when opened normally.
- **Node.js 18+** — only needed to run the scaffolder (`scripts/build-dashboard.mjs`), not to view a dashboard.
- **PowerShell 7 + [vid-scroll](../vid-scroll)** — optional screenshot tooling (see [Integrations](#integrations--sibling-repos)).

## Dependencies

The dashboards themselves have **zero installed dependencies** (`package.json` declares none) — everything runs from `file://` with no `npm install`.

| Dependency | Where | Purpose |
|---|---|---|
| Chart.js | CDN `<script>` in each profile HTML | Charts/gauges/trend lines |
| Google Fonts | CDN `<link>` in each profile HTML | `Outfit` / `JetBrains Mono` type |
| Node.js 18+ | `scripts/build-dashboard.mjs` | Zero-dep scaffolder (uses only `node:fs`, `node:path`, `node:url`) |
| ffmpeg | `scripts/capture.ps1` (optional) | WebP encoding for screenshot captures |

## Integrations — sibling repos

- **[jenninexus/syn-themes](https://github.com/jenninexus/syn-themes)** — the palette direction in `themes/` is inspired by (not generated from) this sibling workspace-themes repo.
- **[vid-scroll](../vid-scroll)** (`C:\Github\vid-scroll`, local sibling repo) — optional full-page screenshot sweep tool used by `scripts/capture.ps1` and `configs/breakpoints.json` to capture every profile at 3 breakpoints (390/768/1280px), expanded + collapsed, as WebP. Not required to use or view a dashboard.
- **sys-admin MCP server** (optional, `.mcp.json.example` → `.mcp.json`) — gives an AI coding agent (Claude Code, etc.) helper tools for emailing reports, backing up to Drive, or logging metrics to a sheet. The dashboard needs no server to function; this is purely an agent convenience.

## APIs / data sources

Every profile is currently **hand-fed from local JSON** — there are no live API calls at runtime. `example-data.json` in each profile folder documents the exact data shape a real profile would fill in:

| Profile | Intended data sources (manual JSON today) |
|---|---|
| **SEO** (`profiles/seo/`) | GA4, Google Search Console, PageSpeed Insights, Cloudflare — see `profiles/seo/profile.json` → `dataSources` |
| **Finances** (`profiles/finances/`) | Manual JSON only (`data.json`) — cash/obligations, bills, loans, income. No SaaS, no remote credentials. |
| **Health** (`profiles/health/`) | Manual JSON only — user-defined metrics, trends, habits, labs, appointments. |

If a future profile automates live fetches (e.g. calling the GA4 or PageSpeed APIs directly), the relevant keys are pre-stubbed — commented out — in `.env.example` (`GA4_PROPERTY_ID`, `GSC_SITE_URL`, `PAGESPEED_API_KEY`, `CLOUDFLARE_API_TOKEN`).

## Env / config

The dashboard needs **none of these to run** — everything below is optional, only used by the scaffolder tooling or an AI agent wiring the optional MCP server. Copy `.env.example` → `.env` and fill in only what you use; names only, no values are ever committed.

| Variable | Purpose |
|---|---|
| `SYSADMIN_ROOT` | Path to a local sys-admin MCP server, if wiring `.mcp.json` |
| `MCP_ROOT` | Root path passed to the sys-admin MCP server |
| `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `PAGESPEED_API_KEY`, `CLOUDFLARE_API_TOKEN` | Reserved for a future automated SEO profile fetch — unused today (SEO profile is hand-fed JSON) |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | Only if you point a local AI agent at this repo to customize/extend a dashboard |

Also see `.mcp.json.example` (copy to `.mcp.json` to enable the optional sys-admin MCP server) and `dashboard.code-workspace.example` (copy to `dashboard.code-workspace` for a preconfigured VS Code workspace).

## Screenshot gallery

- `docs/screenshots/` — checked-in reference screenshots per profile (`seo`, `finances`, `health`), each with expanded/collapsed variants and 390/768/1280px breakpoint sets.
- `storage/screenshots/` — gitignored local staging area for new captures (see `scripts/capture.ps1`); graduate approved shots into `docs/screenshots/` manually.

## Docs you should read first

- [Getting started](docs/getting-started.md)
- [Profile system](docs/profile-system.md)
- [Finances profile playbook](docs/finances-profile.md)

---

## Project structure

```
dashboard/
├── profiles/                  # self-contained HTML dashboards + data per domain
│   ├── seo/
│   │   ├── seo.html           # SEO & Analytics dashboard (GA4, GSC, PageSpeed, Cloudflare)
│   │   ├── example-data.json  # full data schema/contract for this profile
│   │   └── profile.json       # manifest: id, status, theme, sections, dataSources
│   ├── finances/
│   │   ├── finances.html      # Personal Finances dashboard (holdings, bills, loans, income)
│   │   ├── example-data.json
│   │   └── profile.json
│   └── health/
│       ├── health.html        # Health & Wellness dashboard (vitals, trends, habits, labs)
│       ├── example-data.json
│       └── profile.json
├── themes/                    # CSS token/palette presets, copy into a dashboard's <style>
├── scripts/
│   ├── build-dashboard.mjs    # zero-dep scaffold CLI (Node 18+) — copies a profile into my-dashboard/
│   └── capture.ps1            # optional screenshot sweep (uses sibling repo vid-scroll)
├── configs/
│   └── breakpoints.json       # breakpoints/pages config consumed by capture.ps1 / vid-scroll
├── docs/                      # getting-started, profile-system, finances-profile playbooks + screenshots
├── _archive/                  # retired files (e.g. the original monolithic dashboard.html)
├── storage/                   # gitignored local output (screenshots staging, etc.)
├── .env.example                # optional env var names (see Env / config)
├── .mcp.json.example            # optional sys-admin MCP wiring
├── dashboard.code-workspace.example
└── AGENTS.md                  # AI-assistant handoff guide (Claude Code, Copilot, Cursor, Gemini)
```

- `.claude/` and `AGENTS.md` — assistant handoff docs (slash commands: `/build-dashboard`, `/ap`, `/work-start`)

---

## Contributing

Prefer focused PRs:

- add one new profile at a time,
- include a clear `example-data.json`,
- keep output static and local-first,
- add/update docs for any new behavior.

MIT — use, fork, customize

---

<div align="center">

If this dashboard seed helps you build something useful:

[Star this repo](https://github.com/jenninexus/dashboard) · [Links](https://jenninexus.com/links) · [Patreon](https://www.patreon.com/c/JenniNexus) · [Paypal](https://paypal.me/jenninexus)

Published by [Jenni](https://github.com/jenninexus) at [Monofinity Studio](https://github.com/monofinitystudio).

</div>
