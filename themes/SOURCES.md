# Theme Sources — where the dashboard themes come from

This dashboard seed is **self-contained** (themes are inlined into `dashboard.html` so it works
over `file://`). But the theme CSS files here are **generated from the shared theme kits** so the
palettes stay in sync across the whole ecosystem. Don't hand-edit colors here — edit the source
palette in the kit, then re-run the sync.

## The two kits (own by use-case)

| Kit | Owns | Use for |
|-----|------|---------|
| **[syna-theme-kit](../../syna-theme-kit)** | React / TypeScript / **Dockview** apps + the Synagen **theme-customizer** panel. 21 accent palettes + 6 skin families. Originates from the `syn-themes` VS Code extension. | Synabrain, Synagen, Syqo, Sylva — anything React with the live theme picker. |
| **[www-theme-kit](../../www-theme-kit)** | PHP / Bootstrap websites **and standalone-HTML dashboards** (this seed). `tokens/dashboard-palettes.json` is the dashboard-token SSOT. | jenninexus.com etc., `/seo` analytics dashboards, and `/dashboard` + `/build-dashboard` output. |

> Both kits carry the same palette *names* (e.g. Aurora Borealis). syna-kit holds the React/Dockview
> form; www-kit holds the dashboard-token form. **This seed pulls from www-theme-kit.**

## Theme → source palette manifest

| Theme file | Source kit | Palette key | Notes |
|------------|-----------|-------------|-------|
| `plasma-green.css` | www-theme-kit | `plasma-green` | Default. JenniNexus dashboard family (fin.html, ruben.html). |
| `aurora-borealis.css` | www-theme-kit | `aurora-borealis` | Turquoise/purple/pink. Synced **tokens only**. |
| `aurora-borealis.effects.css` | (hand-authored) | — | Optional shimmer + rainbow-border effects companion. **Never synced.** Include after the token block for the full holographic look (Kat's dashboard). |
| `midnight-blue.css` | (local starter) | — | Original cool indigo/blue; not kit-derived. |
| `seo-tokens.css` | **Tier-1 (vendor)** | — | GA4/GSC/Cloudflare brand colors — **do not regenerate**. |

> **Tokens vs effects:** `sync-themes.mjs` regenerates the `:root` **color tokens** only (the part
> that must track the kit). Visual *effects* (animations, gradient classes) are presentation logic —
> keep them in a `*.effects.css` companion the sync never overwrites. That's why Aurora has two files.

Source palette files:
- `C:\Github\www-theme-kit\tokens\dashboard-palettes.json` — dashboard-token palettes (this seed's source)
- `C:\Github\www-theme-kit\tokens\DASHBOARD-PALETTE-GUIDE.md` — full guide + the two-style-system explainer
- `C:\Github\syna-theme-kit\palettes\syna-palettes.json` — the React/Dockview form (21 palettes)

## Regenerate the themes from the kit

```bash
node scripts/sync-themes.mjs            # regenerate ALL kit-derived themes
node scripts/sync-themes.mjs aurora-borealis   # just one
node scripts/sync-themes.mjs --list     # show available source palettes
```

This reads `www-theme-kit/tokens/dashboard-palettes.json` and rewrites each mapped `themes/*.css`
`:root` token block. `midnight-blue.css` and `seo-tokens.css` are skipped (not kit-derived).

## Add a new preset (e.g. "synthwave")

1. Make sure the palette exists in `www-theme-kit/tokens/dashboard-palettes.json` (add it there if not —
   that's the SSOT; copy the `colors` from syna-palettes if it only lives on the React side).
2. Add a row to the manifest table above.
3. `node scripts/sync-themes.mjs synthwave` → generates `themes/synthwave.css`.
4. Inline it into a dashboard or `<link>` it (see `themes/README.md`).
