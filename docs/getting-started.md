# Getting started

## Pick your profile first

- **SEO** — site analytics (GA4, Search Console, PageSpeed).
- **Finances** — local money snapshot (cash, bills, loans, income).
- **Health** — human wellness (vitals, meds, labs, habits, sleep).
- **Pets** — senior pet care (weight, QoL, fluids, red flags).

Each one is fully built. Open the example HTML or scaffold a copy.

## Prerequisites

- A browser. That's it for viewing.
- Optional: Node 18+ for `npm run build-dashboard`.

## 3-step setup

1. **Open the profile** — `profiles/{id}/{id}.html` directly in your browser.
2. **Or scaffold your own** — `npm run build-dashboard -- --profile <id> --name "Your Name"`. This creates `my-dashboard/` with `dashboard.html`, `themes/`, a stamped `data.json`, and any in-repo banner images (pets: `docs/images/pets/`).
3. **Replace example data** — open `my-dashboard/data.json` and fill in your real numbers.

No server. No build step for viewing.

## What to open first

| Profile | Example HTML | Config |
|---------|-------------|--------|
| SEO | `profiles/seo/seo.html` | `profiles/seo/profile.json` |
| Finances | `profiles/finances/finances.html` | `profiles/finances/profile.json` |
| Health | `profiles/health/health.html` | `profiles/health/profile.json` |
| Pets | `profiles/pets/pets.html` | `profiles/pets/profile.json` |

## Commands

| Command | What it does |
|---|---|
| `npm run profiles` | Lists available profiles |
| `npm run build-dashboard -- --profile <id> --name <name> [--domain <domain>] [--out <folder>]` | Scaffolds `<folder>` |
| `npm run open` | Opens `profiles/seo/seo.html` |

## Customize safely

- Keep `example-data.json` as the contract example.
- Keep sensitive values in your personal `data.json` only.
- Want a daily finance *workspace* (autopay, archive, startup script)? That is [jenninexus/fin](https://github.com/jenninexus/fin), not this profile.
- Want printable pet-care sheets? That is [jenninexus/senior-pet-care](https://github.com/jenninexus/senior-pet-care).

## Open in your editor

Open `dashboard.code-workspace.example` as a workspace (or copy it to `dashboard.code-workspace` — gitignored).
