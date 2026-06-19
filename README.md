<div align="center">

# Dashboard

![MIT](https://img.shields.io/badge/license-MIT-00e879?style=flat-square)
![Runtime](https://img.shields.io/badge/runtime-static%20HTML-42f4c8?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-zero--deps-39ff8c?style=flat-square)
![Mode](https://img.shields.io/badge/mode-local--first-00e5ff?style=flat-square)

## Make one dashboard.
## For everyone.

`dashboard` is a profile-based, local-first seed for quick, private, custom dashboards.
Pick a domain (`SEO`, `finances`, etc.), replace one JSON file, and get a polished single-file dashboard in seconds.

</div>

- ✨ No server needed — open from `file://` or deploy static.
- 🧩 Profiles drive what you track.
- 🎨 Themes drive how it looks.
- 🤝 Assistant-friendly scaffold flow.

---

## Who is this for?

- Makers who want a clean starting point instead of building from zero.
- People who want to track one area deeply, then share it with others.
- Solo builders and small teams who like local-first, editable dashboards.

### Pick your starting profile

- **SEO**: Use it for sites, reports, and growth telemetry in one place.
  - Start with: `profiles/seo/`
- **Personal finance**: Use it for bills, obligations, cash, and income snapshots.
  - Start with: `profiles/finances/`
- **Hobby projects**: Use it for fitness, learning goals, content calendars, or experiments.
  - Start with whichever profile already has the closest structure, then customize data keys.

---

## Quick start (2 minutes)

```bash
git clone https://github.com/jenninexus/dashboard.git
cd dashboard
npm run profiles
npm run build-dashboard -- --profile finances --name "Your Name" --domain example.com
```

Then:

1. Open `my-dashboard/dashboard.html`.
2. Edit `my-dashboard/data.json`.
3. Refresh.

No build step is required to run. No runtime dependencies.

---

## Profiles at a glance

| Profile | Status | Tracks |
|---|---|---|
| [seo](profiles/seo/) | ✅ Ready | GA4, Search Console, PageSpeed, Cloudflare |
| [finances](profiles/finances/) | ✅ Ready | cash vs obligations, bills, loans/repayments, income |
| [health](profiles/health/) | 🚧 Planned | habits, labs, sleep, and appointments |

## Why there is a root dashboard

The root `dashboard.html` is the polished SEO showcase and the default file people can open immediately.
SEO currently uses that root file as its reference render because it has the richest graph and analytics layout.

Profile folders hold the reusable source material for each dashboard type:

- `profiles/seo/` defines the SEO data contract.
- `profiles/finances/dashboard.html` exists because finance has a different schema and layout.
- `profiles/health/` is planned, so it does not need an HTML render until the profile is ready.

---

## Themes

The default look is **Plasma Green**: neon glass, readable cards, and bright status accents.
Additional palettes live in `themes/` and can be copied into a dashboard's `<style>` block or linked when served over HTTP.

The palette direction is inspired by the workspace themes and VS Code extension in [jenninexus/syn-themes](https://github.com/jenninexus/syn-themes).

Included palettes:

- `plasma-green.css` — default dark neon dashboard palette
- `aurora-borealis.css` — prismatic turquoise, purple, and pink
- `midnight-blue.css` — cooler blue dashboard starter
- `aurora-borealis.effects.css` — optional shimmer effects for the aurora palette

---

## Screenshot gallery

Screenshots live in `docs/screenshots/`. Add or replace these files as profiles mature:

| Profile | Screenshot |
|---|---|
| SEO | [docs/screenshots/seo-dashboard.png](docs/screenshots/seo-dashboard.png) |
| Finances | [docs/screenshots/finances-dashboard.png](docs/screenshots/finances-dashboard.png) |
| Health | `docs/screenshots/health-dashboard.png` coming later |

- Use a consistent 16:9 ratio.
- Keep profile screenshots focused on the actual dashboard, not a marketing banner.

---

## Docs you should read first

- [Getting started](docs/getting-started.md)
- [Profile system](docs/profile-system.md)
- [Finances profile playbook](docs/finances-profile.md)
- [Profiles reference](profiles/README.md)

---

## Repo contents in 10 seconds

- `dashboard.html` — baseline render shell, file:// safe
- `scripts/build-dashboard.mjs` — profile scaffold CLI (Node 18+)
- `profiles/` — profile manifests and example data
- `themes/` — token presets and theme sources
- `.claude/` and `AGENTS.md` — assistant handoff docs

---

## Contributing

Prefer focused PRs:

- add one new profile at a time,
- include a clear `example-data.json`,
- keep output static and local-first,
- add/update docs for any new behavior.

MIT — use it, fork it, customize it.

---

<div align="center">

If this dashboard seed helps you build something useful:

[Star](https://github.com/jenninexus/dashboard) · [Follow](https://jenninexus.com/links) · [Patreon](https://www.patreon.com/c/JenniNexus) · [Paypal](https://paypal.me/jenninexus)

Published by [Jenni](https://github.com/jenninexus) at [Monofinity Studio](https://github.com/monofinitystudio).

</div>
