# Getting started

## Prerequisites

- Any current browser for viewing a profile or generated dashboard.
- Node.js 18 or newer for scaffolding, updating, tests, or the local wizard.
- No `npm install`, account, API key, backend, or internet connection.

## Choose a workflow

### Wizard

On Windows, double-click `Dashboard.cmd`. On macOS or Linux:

```bash
npm run dashboard
```

Choose a profile and compatible public theme, enter an output folder, and create or open a local
dashboard. The wizard offers schema-driven fields plus a raw-JSON route. It validates before saving,
preserves unknown fields, updates the existing HTML, and can import/export JSON. Press **Stop** when
finished; the loopback-only server also has an idle shutdown.

### Command line

```bash
npm run profiles
npm run build-dashboard -- --profile finances --name "My Finances" --out my-dashboard
```

Edit `my-dashboard/data.json`, then publish that validated data into the existing HTML:

```bash
npm run dashboard:update -- --out my-dashboard
```

Open `my-dashboard/dashboard.html`. Repeat the edit/update step whenever JSON changes. Scaffolding
refuses an existing output directory; `--force` is intentionally not an update mechanism.

### View an example only

Open any `profiles/<id>/<id>.html` directly. These committed examples are fictional and require no
network resources.

## Profiles

| id | Focus | Files |
|---|---|---|
| `seo` | analytics and search visibility | `profiles/seo/` |
| `finances` | local money snapshot | `profiles/finances/` |
| `health` | personal wellness | `profiles/health/` |
| `pets` | senior pet care | `profiles/pets/` |

## What stays local

Your output is ignored by Git. `data.json`, generated HTML, exports, and the rotating backup are
unencrypted plaintext, so keep the output folder private and protected like the records it contains.
Theme/collapse/checklist browser state is disposable and is not part of JSON backups.

See [PUBLIC-LOCAL-SPLIT.md](PUBLIC-LOCAL-SPLIT.md) for the full repository boundary.
