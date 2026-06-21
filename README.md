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

## Screenshot gallery

Screenshots are in `storage/screenshots/` (pending). Add or replace these files as profiles mature.

- Use a consistent 16:9 ratio.
- Keep profile screenshots focused on the actual dashboard, not a marketing banner.

---

## Docs you should read first

- [Getting started](docs/getting-started.md)
- [Profile system](docs/profile-system.md)
- [Finances profile playbook](docs/finances-profile.md)

---

## Repo contents in 10 seconds

- `profiles/` — self-contained HTML dashboards and data files per domain
- `themes/` — token presets and theme sources
- `scripts/build-dashboard.mjs` — profile scaffold CLI (Node 18+)
- `_archive/` — retired files kept for reference
- `.claude/` and `AGENTS.md` — assistant handoff docs

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
