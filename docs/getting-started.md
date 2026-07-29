# Getting started

## Pick your profile first

Start by choosing one profile and copy that pattern:

- **SEO** — site analytics (GA4, Search Console, PageSpeed).
- **Finances** — local money clarity (cash, bills, loans, income).
- **Health** — habits, vitals, meds, labs, appointments.

Use the profile you want first, then iterate. Each one is fully built and ready.

## Prerequisites

- A browser. That's it for viewing.
- Optional: Node 18+ for `npm run build-dashboard` (only needed for the scaffolder).

## 3-step setup

1. **Open the profile** — `profiles/{id}/{id}.html` directly in your browser. Each one is fully built with example data.
2. **Or scaffold your own** — `npm run build-dashboard -- --profile <id> --name "Your Name"`. This creates `my-dashboard/` with `dashboard.html`, `themes/`, and a stamped `data.json`.
3. **Replace example data** — open `my-dashboard/data.json` and fill in your real numbers. Every field has a `_comment` explaining what it is.

That's it. No server, no build step.

## What to open first

| Profile | Example HTML | Config |
|---------|-------------|--------|
| SEO | `profiles/seo/seo.html` | `profiles/seo/profile.json` |
| Finances | `profiles/finances/finances.html` | `profiles/finances/profile.json` |
| Health | `profiles/health/health.html` | `profiles/health/profile.json` |

Open `profiles/seo/seo.html` directly in a browser — it loads from `file://` with no server.

## Commands (if you use the scaffolder)

| Command | What it does |
|---|---|
| `npm run profiles` | Lists available profiles and readiness |
| `npm run build-dashboard -- --profile <id> --name <name> [--domain <domain>] [--out <folder>]` | Builds a runnable dashboard in `<folder>` |
| `npm run open` | Opens `profiles/seo/seo.html` |

## Design your own dashboard from a profile

1. Choose the closest profile.
2. Build it once.
3. Change only `data.json` until structure is right.
4. Edit `profile/{profile-id}.html` only when you need new sections.
5. Move the result to your own distribution branch.

This approach keeps the core template stable and user-visible behavior predictable.

## Customize safely

- Keep `example-data.json` as the contract example.
- Keep sensitive values in your personal `data.json` only.
- If you publish publicly, document data ownership and any required setup in your fork README.

## Open in your editor

If you cloned this with VS Code, Cursor, opencode, or another IDE, open the
`dashboard.code-workspace.example` as a workspace (or copy it to
`dashboard.code-workspace` to customize locally — that file is gitignored).