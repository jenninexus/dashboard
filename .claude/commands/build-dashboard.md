# /build-dashboard — scaffold & customize a dashboard

Set up a polished, self-contained dashboard for the user from a **profile**, then help them
fill it in. Works in this repo (the dashboard seed kit). Agent-agnostic — the heavy lifting is
a zero-dep Node script; you orchestrate + customize.

## How to invoke

```
/build-dashboard [profile] [name] [domain]
```
e.g. `/build-dashboard seo "Acme Studio" acme.com`

## Steps

1. **Pick the profile.** If the user didn't say, list options:
   ```bash
   node scripts/build-dashboard.mjs --list
   ```
   `seo` is ready; `finances`/`health` are planned stubs (offer to build out if asked).

2. **Scaffold** (never hand-build the files — run the script):
   ```bash
   node scripts/build-dashboard.mjs --profile <id> --name "<Name>" --domain <domain>
   ```
   This creates `my-dashboard/` with `dashboard.html`, `themes/`, and a stamped `data.json`.

3. **Help fill the data.** Open `my-dashboard/data.json` — every field has a `_comment`. If the
   user gives you their numbers (GA4 screenshot, Search Console export, etc.), write them in.
   Leave unknowns at their example values or `null`.

4. **Theme (optional).** Default is Plasma Green. To reskin, copy a `themes/*.css` block into
   the `<style>` at the top of `my-dashboard/dashboard.html` (see `themes/README.md`). Match a
   brand color by setting `--primary` (+ `--primary-rgb`), `--secondary`, `--accent`, `--glow`.

5. **Open it:** `start my-dashboard/dashboard.html` (Windows) / `open` (mac) / `xdg-open` (linux).

6. **Verify** it renders (charts populate, no console errors). If you can screenshot, do so.

## Customizing what's tracked

- **Add a metric** → add the field to `data.json` (with a `_comment`) + reference it in `dashboard.html`.
- **Add a chart** → `<canvas id="x">` in a `.chart-container` + `new Chart(...)` in the script block.
- **Add a section** → copy a card block, new id, wire its data.
- **New domain** → copy `profiles/seo` → `profiles/<new>`, edit `profile.json` + `example-data.json`.

## Building out a planned profile (finances / health)

The stubs in `profiles/finances/` and `profiles/health/` list the sections + which reusable
components to port (progress bars, gauges, foldouts, chips). Generalize them — never copy
personal data. Then flip `profile.json` → `"status": "ready"` and add a row to `profiles/README.md`.

## Rules

- The dashboard must stay **self-contained** (works over `file://`, no required server).
- Keep secrets out of tracked files — `.env` only (gitignored).
- Don't edit `themes/seo-tokens.css` Tier-1 brand colors (canonical vendor values).
- User output (`my-dashboard/`) is gitignored — that's the user's, not the seed.
