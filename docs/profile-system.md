# Profile system

A profile is a complete domain package: render, schema, and behavior.

## Minimum profile files

Inside `profiles/<id>/`:

- `profile.json` for metadata, status, and section intent.
- `example-data.json` for data shape and seeded defaults.
- `dashboard.html` for profile-specific rendering.

## How profiles work

1. Scaffold copies `example-data.json` to `my-dashboard/data.json`.
2. Name/domain values are injected if provided.
3. Dashboard and `themes/` are copied into output.
4. The output dashboard reads your JSON and renders instantly.

## Root dashboard vs profile dashboards

The root `dashboard.html` is intentionally kept as the main SEO demo. It shows the strongest graph-heavy dashboard style and gives visitors something useful to open immediately.

Not every profile needs its own HTML file:

- Use the root `dashboard.html` when a profile can share the default SEO-style render.
- Add `profiles/<id>/dashboard.html` when the profile needs a different schema, layout, or interactions.
- Keep planned profiles manifest-only until their data and layout are ready.

## Build your own profile (recommended path)

1. Pick the profile closest to your goal.
2. Copy it as `profiles/<your-profile>/`.
3. Change `profile.json` identity and section descriptions.
4. Edit `example-data.json` so all required fields are clear.
5. Adjust `dashboard.html` for new sections only where needed.
6. Test with `npm run build-dashboard -- --profile <your-profile>`.
7. Add docs to explain your new fields and edge behavior.

## Design tips

- Start by removing fields, not adding first.
- Keep status colors and labels obvious for people skimming.
- If using charts, preserve meaningful labels and numeric units.
- Stay static-friendly: generated output should open from `file://`.

Use these files together as your playbook:
- [Getting started](getting-started.md)
- [Existing profiles reference](../profiles/README.md)
