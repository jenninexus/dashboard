# Getting started

## Pick your profile first

Start by choosing one profile and copy that pattern:

- SEO: metrics-focused setup.
- Finances: local money clarity.
- Hobbyist profiles: treat as a template and simplify data fields.

Use the profile you want first, then iterate.

## Prerequisites

- Git
- Optional: Node 18+ for `npm run build-dashboard`
- Browser

## 3-step setup

1. `git clone https://github.com/jenninexus/dashboard.git`
2. `npm run profiles`
3. `npm run build-dashboard -- --profile <id> --name "Your Name"`

Then open `my-dashboard/dashboard.html` and refresh after edits.

## Commands

| Command | What it does |
|---|---|
| `npm run profiles` | Lists available profiles and readiness |
| `npm run build-dashboard -- --profile <id> --name <name> [--domain <domain>] [--out <folder>]` | Builds a runnable dashboard in `<folder>` |
| `npm run open` | Opens `dashboard.html` |

## Design your own dashboard from a profile

1. Choose the closest profile.
2. Build it once.
3. Change only `data.json` until structure is right.
4. Edit `profile/dashboard.html` only when you need new sections.
5. Move the result to your own distribution branch.

This approach keeps the core template stable and user-visible behavior predictable.

## Customize safely

- Keep `example-data.json` as the contract example.
- Keep sensitive values in your personal `data.json` only.
- If you publish publicly, document data ownership and any required setup in your fork README.
