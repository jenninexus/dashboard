# Architecture

Dashboard has two runtimes with one shared core:

- Generated dashboards are standalone HTML/CSS/JavaScript files opened from `file://`.
- Authoring tools use Node.js built-ins only: the CLI and a temporary loopback wizard.

There is no framework, bundler, package dependency, backend, telemetry, remote font, CDN chart
runtime, or environment-variable integration. The pet profile draws its chart as inline SVG and
keeps exact readings in an accessible table.

## Shared authoring core

| Surface | Responsibility |
|---|---|
| `scripts/lib/strict-json.mjs` | bounded strict JSON parsing and safe script serialization |
| `scripts/lib/dashboard-paths.mjs` | containment, protected-source, link, and hardlink checks |
| `scripts/lib/dashboard-core.mjs` | profile/schema/theme loading, scaffold, read/save/update/restore transactions, provenance and backup handling |
| `scripts/build-dashboard.mjs` | new-output CLI |
| `scripts/update-dashboard.mjs` | existing-output CLI |
| `scripts/wizard/` | capability-protected localhost UI over the same core |

Generated HTML contains marked data and theme regions plus embedded provenance mirrored in
`.dashboard-meta.json`. The updater verifies the profile, contract, template/theme metadata, unique
markers, and local files before publishing. Writes stage and verify content before the publish rename;
invalid input leaves the last good dashboard intact.

## Local wizard threat boundary

The wizard binds to `127.0.0.1`, uses a random per-run capability, checks Host/Origin/method/content
type/request size, and limits all dashboard I/O to the selected safe output root. Repository source
directories, filesystem roots, symbolic links/junctions, and multiply-linked data files are rejected.
Optimistic revisions prevent two browser views from silently overwriting one another. Stop and idle
shutdown release the port.

This protects against incidental local cross-origin writes and path mistakes; it does not encrypt
the user's files or turn an untrusted computer account into a safe vault.

## Profile rendering rules

Each profile keeps its own renderer and visual identity. `editor-schema.json` is the common editing
contract, not a generic visual renderer. Text is plain text, dynamic attributes are allowlisted, and
required content remains available offline. Browser-local view/checklist state is explicitly
disposable; durable content belongs in `data.json`.

## Themes and media

`themes/manifest.json` is the public theme authority. A generated dashboard inlines the selected
shipped CSS in its marked theme region; it never reads another checkout at runtime.

`docs/images/` is for runtime profile art copied into outputs. `docs/screenshots/hero/` is the four-
image README gallery. Full responsive sweeps are ignored local QA evidence under
`storage/screenshots/`.

The optional `scripts/capture.ps1` wrapper discovers a sibling `vid-scroll` checkout or
`VID_SCROLL_DIR`, resolves the current clone path into a temporary ignored config, and writes local
evidence by default. It is contributor tooling, not a runtime dependency.

Captures open every page with `?today=asof`, which pins the page's clock to that profile's own as-of
date (`profile.asOf` or `profile.last_updated`), so screenshots of the fictional examples never age into
months of overdue items. `-RealDate` renders with the machine's date instead. Hero captures written to
`docs/screenshots/hero/` are renamed to the `<slug>-<width>.png` names the README links. The same query
works in a browser: open `profiles/finances/finances.html?today=asof`.

## Verification

`npm test` covers the core, schema contracts, hostile data, finance derivations, offline render
scripts, themes, and wizard security/flows. `npm run check:public-boundary` rejects tracked local or
generated surfaces and machine-specific absolute paths. Browser QA is still required for layout,
real keyboard behavior, contrast, and full user-flow claims.
