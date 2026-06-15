# Dashboard

A self-contained, themeable **dashboard seed kit**. Pick a **profile** — SEO, finances, health,
or your own — drop in a JSON file, and ship a polished single-file dashboard. No build step, no
framework, no backend. Open `dashboard.html` and it just works.

> **Preview:** open [`dashboard.html`](dashboard.html) (or any `profiles/*/dashboard.html`) directly
> in a browser — it's a single self-contained file. A screenshot lives in `docs/` once added.

---

## Why

Most dashboards are either a heavyweight SaaS you don't control or a spreadsheet you copy
numbers into. This is the middle path: **one HTML file, your data in JSON, your colors, fully
yours.** Built to be forked.

- **Profiles** decide *what* you track. SEO + finances ship ready; health is on the roadmap.
- **Themes** decide *how it looks*. Default is a polished neon "Plasma Green"; swap one token block to reskin.
- **An agent layer** (`AGENTS.md` + a scaffold script + a `/build-dashboard` skill) lets any AI assistant — or a plain `npm` command — set one up for you.

---

## Quick start

```bash
git clone https://github.com/jenninexus/dashboard.git
cd dashboard

# See available profiles
npm run profiles

# Scaffold your own (creates ./my-dashboard/)
npm run build-dashboard -- --profile seo --name "Your Brand" --domain yoursite.com
```

Then edit `my-dashboard/data.json` (every field is commented) and open
`my-dashboard/dashboard.html` in a browser. Done.

Prefer an AI assistant? Just say **"set up the SEO dashboard for mysite.com"** — see
[`AGENTS.md`](AGENTS.md).

---

## Profiles

| Profile | Status | Tracks |
|---------|--------|--------|
| **[seo](profiles/seo/)** | ✅ ready | GA4, Search Console, PageSpeed, Cloudflare — client-ready SEO reports |
| **[finances](profiles/finances/)** | ✅ ready | cash vs obligations, bills, loans/repayments, income — local-only, no SaaS |
| [health](profiles/health/) | 🚧 planned | custom metrics — weight, sleep, labs, habits, appointments |

Each profile is a folder with a `profile.json` manifest + a fully-commented `example-data.json`.
Add your own in minutes — see [`profiles/README.md`](profiles/README.md).

---

## Theming

Ships dark with the **Plasma Green** palette. Toggle
light/dark with the header button. Presets: `plasma-green`, `aurora-borealis` (holographic),
`midnight-blue`. To reskin, copy a `themes/*.css` token block into `dashboard.html` — or link it
over HTTP. Full contract + alternate palettes: [`themes/README.md`](themes/README.md).

**Theme tokens are kit-derived** (don't hand-edit colors) — they sync from the shared theme kits:
**www-theme-kit** owns dashboard/PHP tokens (this seed's source), **syna-theme-kit** owns
React/Dockview/Synagen-customizer palettes. Mapping + regen: [`themes/SOURCES.md`](themes/SOURCES.md)
→ `node scripts/sync-themes.mjs`.

```css
:root{
  --primary:#00e879; --primary-rgb:0,232,121;
  --secondary:#00e5ff; --accent:#42f4c8; --glow:rgba(0,232,121,.13);
}
```

---

## What's in the box

```
dashboard.html              # the render shell (self-contained, themed, file://-safe)
profiles/
  seo/        profile.json + example-data.json + dashboard.html   ← ready
  finances/   profile.json + example-data.json + dashboard.html   ← ready
  health/     profile.json (stub)                                 ← planned
themes/       plasma-green.css · midnight-blue.css · aurora-borealis.css · seo-tokens.css (Tier-1) + README
scripts/build-dashboard.mjs # zero-dep scaffolder
.claude/commands/build-dashboard.md  # the /build-dashboard skill
AGENTS.md                   # AI-assistant guide (agent-agnostic)
.mcp.json.example           # optional MCP wiring (email/Drive/sheet helpers)
.env.example                # optional env (all optional — static app needs none)
```

---

## Dev setup (optional)

Copy the example configs (the real ones are gitignored so your secrets/tweaks stay local):

```bash
cp dashboard.code-workspace.example dashboard.code-workspace   # cute Plasma-Green VS Code workspace + tasks
cp .env.example .env                                           # only if you wire optional MCP/live data
cp .mcp.json.example .mcp.json                                 # only if you use an AI agent's MCP tools
```

Open `dashboard.code-workspace` for themed chrome + one-click tasks (list profiles, build, open).

---

## Dependencies

Loaded via CDN — no `npm install` needed to *run* it.

| Library | Why |
|---------|-----|
| [Chart.js](https://www.chartjs.org/) 4.4.4 | line / bar / doughnut charts + custom annotations |
| [Outfit](https://fonts.google.com/specimen/Outfit) | body text (canonical dashboard sans) |
| [Orbitron](https://fonts.google.com/specimen/Orbitron) | display headings (`--heading`) |
| [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | metrics & code (`--mono`) |

> Fonts are the canonical dashboard stack defined in the upstream theme kit (`tokens/dashboard-tokens.css` → `--dash-body`/`--dash-heading`/`--dash-mono`; see `themes/SOURCES.md`). Already inlined into the seed — don't reintroduce per-dashboard fonts.

The scaffold script uses only Node's standard library (Node 18+).

---

## Roadmap

- [x] Generic seed + profile system + Plasma Green theme + agent layer
- [x] **SEO** profile (ready)
- [x] **Finances** profile (ready) — data-driven `data.json`: holdings coverage bars, loan foldouts, bills, income
- [ ] **Health** profile — user-defined metrics, trends, habit streaks
- [ ] Live-data adapters (optional) per profile
- [ ] Per-profile blog posts + screenshots

---

## License

MIT — use it, fork it, sell it, ship it. Attribution appreciated, not required.
