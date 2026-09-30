# Profiles

Each folder is one domain package: `profile.json` (manifest), `{id}.html` (the dashboard), `example-data.json` (fictional data), and `editor-schema.json` (the versioned editing contract).

| id | Theme | Tracks |
|---|---|---|
| `seo` | aurora-seo | GA4 · Search Console · PageSpeed · Cloudflare |
| `finances` | emerald-finance | Cash vs obligations · bills · loans · income |
| `health` | vitality-health | Human wellness — vitals, meds, labs, habits, sleep |
| `pets` | dusk-companion | Senior pet care — weight, QoL, fluids, red flags (pink dusk) |

## File convention

- Manifest: `profiles/<id>/profile.json` (never `<id>.json`)
- Example HTML: `profiles/<id>/<id>.html` (never `dashboard.html` inside the profile)
- `profile.render` is a path from the **repo root**, e.g. `profiles/seo/seo.html`
- `profile.dataInjection.scriptId` must match the inline `<script id="…">` the HTML reads
- `profile.dataContractVersion`, `editor-schema.version`, and example `schemaVersion` agree

## Editor contracts and rendering

`editor-schema.json` uses the small `dashboard-editor` format, not JSON Schema. Sections contain ordered fields with dot paths (`bills[].amount` traverses every bill). Types are `string`, `number`, `boolean`, `date`, and `enum`. Fields declare required/nullable state, labels, units/help, and relevant `min`, `max`, `maxLength`, `pattern`, or `values` constraints. Collections declare their size bounds and stable record identity. Object records have IDs; primitive lists retain their order. Preserve unknown fields when editing; changing a contract version requires an explicit migration.

Profile text is plain text, never user-supplied rich HTML. Renderers use DOM text nodes or HTML-encoded values inside fixed layout templates. Dynamic colors accept hex values only, and dynamic percentages are numeric. New render paths must retain these boundaries. The inline data and JSON fixture must remain identical.

Finance is a snapshot. Liquid holdings, selected-cycle bills, outstanding bills, active/variable income, and savings rate derive from the displayed records. Expenses remain an explicit nullable snapshot. Autopay means scheduled, not paid. Net worth remains unknown unless the liability list is declared complete. A loan with `balanceBasis: "principal-minus-paid"` derives its balance from principal minus paid-to-date; an explicit `stillOwed` must agree. Dates are ISO calendar dates, and a date-only `window.dashboardToday` set before rendering overrides the local calendar clock for deterministic tests. Month-only SEO milestones carry `datePrecision: "month"`.

`data.json`, generated HTML, exports, and backups are unencrypted plaintext. Theme/collapse preferences and checklist completion are disposable browser-local state, excluded from JSON backups; checking an item does not create a durable care record or payment record. No profile requires a CDN or remote font. The pet chart uses inline SVG and retains its exact readings in an accessible table.

Run `node --test tests/profiles.test.mjs` for fixture/contract consistency, hostile-text rendering, finance/date logic, asset and breakpoint guards, and chart data coverage. These checks execute the actual inline scripts against a DOM recorder; they do not replace browser, accessibility, or human workflow verification.

## Sister trackers (not profiles)

- Printable pet-care Markdown: [jenninexus/senior-pet-care](https://github.com/jenninexus/senior-pet-care)

See [docs/profile-system.md](../docs/profile-system.md) to add your own.
