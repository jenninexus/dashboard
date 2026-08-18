# Profile system

A profile is a complete domain package: render, schema, and behavior.

## Minimum profile files

Inside `profiles/<id>/`:

- `profile.json` for metadata, status, theme, and section intent.
- `example-data.json` for data shape (must match the inline `<script id="…">` the HTML reads).
- `{id}.html` for profile-specific rendering.

There is **no** root `dashboard.html`. The scaffolder copies `{id}.html` to `my-dashboard/dashboard.html`.

## How profiles work

1. Scaffold copies `example-data.json` to `my-dashboard/data.json`.
2. Name/domain values are injected if provided (`site{}` or `profile{}`).
3. The profile HTML and `themes/` are copied into output.
4. If `dataInjection.scriptId` is set, that inline JSON block is replaced with the stamped data.
5. Open `my-dashboard/dashboard.html` from `file://`.

## Build your own profile

1. Copy the closest profile folder.
2. Change `profile.json` identity, `theme`, `render` (`profiles/<id>/<id>.html`), and `dataInjection.scriptId`.
3. Edit `example-data.json` so every field is clear (`_comment` keys welcome).
4. Adjust the HTML for new sections only where needed.
5. Test with `npm run build-dashboard -- --profile <your-profile> --force --out my-dashboard`.
6. Add a row to `profiles/README.md`.

## Design tips

- Start by removing fields, not adding first.
- Keep status colors obvious for people skimming.
- Stay static-friendly: generated output should open from `file://`.
- Per-profile themes stay distinct (aurora-seo / emerald-finance / vitality-health / dusk-companion). Shared chrome is collapse, radii, and breakpoints — not the same accent.

See also: [Getting started](getting-started.md) · [Existing profiles](../profiles/README.md)
