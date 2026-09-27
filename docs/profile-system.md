# Profile system

A profile is a complete domain package under `profiles/<id>/`:

- `profile.json` — routing identity, renderer, default theme, and contract version.
- `editor-schema.json` — compact `dashboard-editor` editing/validation contract.
- `example-data.json` — fictional versioned fixture.
- `<id>.html` — profile-specific standalone renderer.

The editor format is intentionally small and is not advertised as JSON Schema. Its ordered sections
describe fields, types, required/nullable state, bounds, enums, help text, and collection identities.
Unknown fields are preserved. Changing a contract version requires an explicit migration; current
generated outputs are rejected rather than guessed or silently upgraded.

## Scaffold and update lifecycle

1. The scaffolder loads and validates the profile manifest, editor contract, fixture, renderer, and
   default theme.
2. It creates a new output folder and writes `data.json`, `dashboard.html`, and
   `.dashboard-meta.json`; existing output is never overwritten.
3. Runtime art actually referenced under `docs/images/` is copied and paths are rewritten for the
   generated folder.
4. `dashboard:update` validates local `data.json` and provenance, then replaces only the one marked
   embedded-data region in the existing HTML.
5. Custom HTML/CSS outside that region remains byte-identical. A changed update rotates one
   `dashboard.html.bak`; a no-op creates no backup.

The wizard calls the same core APIs for profile loading, validation, serialization, saves, updates,
and restores. It is not a second data path.

## Build a profile

1. Copy the closest profile folder and give every manifest/schema identity a new lowercase id.
2. Keep the fixture's `schemaVersion`, manifest `dataContractVersion`, and editor schema version in
   agreement.
3. Give object records stable ids and declare collection identity; primitive arrays remain ordered.
4. Treat user text as plain text. Use DOM text nodes or encode it at fixed HTML boundaries; allowlist
   colors, URLs, enums, and numeric ranges.
5. Keep the inline `application/json` block exactly equal to `example-data.json`.
6. Use only canonical media-query max widths: `389.98`, `575.98`, `767.98`, and `991.98px`.
7. Keep the renderer useful offline and expose exact chart values in accessible text/table form.
8. Add a compatible default to `themes/manifest.json`, then run `npm test`.
9. Test a fresh output folder; never use `--force` as a shortcut.

See [profiles/README.md](../profiles/README.md) for field semantics and
[getting-started.md](getting-started.md) for the user flow.
