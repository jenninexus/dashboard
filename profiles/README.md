# Profiles

Each folder is one domain package: `profile.json` (manifest), `{id}.html` (the dashboard), and `example-data.json` (the data contract).

| id | Theme | Tracks |
|---|---|---|
| `seo` | aurora-seo | GA4 · Search Console · PageSpeed · Cloudflare |
| `finances` | emerald-finance | Cash vs obligations · bills · loans · income |
| `health` | vitality-health | Human wellness — vitals, meds, labs, habits, sleep |
| `pets` | dusk-companion | Senior pet care — weight, QoL, fluids, red flags |

## File convention

- Manifest: `profiles/<id>/profile.json` (never `<id>.json`)
- Example HTML: `profiles/<id>/<id>.html` (never `dashboard.html` inside the profile)
- `profile.render` is a path from the **repo root**, e.g. `profiles/seo/seo.html`
- `profile.dataInjection.scriptId` must match the inline `<script id="…">` the HTML reads

## Sister trackers (not profiles)

- Operational finance workspace: [jenninexus/fin](https://github.com/jenninexus/fin)
- Printable pet-care Markdown: [jenninexus/senior-pet-care](https://github.com/jenninexus/senior-pet-care)

See [docs/profile-system.md](../docs/profile-system.md) to add your own.
