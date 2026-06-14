# Themes

Swap the whole look by changing one Tier-2 token block. The default (**Plasma Green**) is
inlined into `dashboard.html` so it works over `file://` with no fetch — the files here are
the canonical contract + ready-made alternates.

## Token contract

| Token | Role |
|-------|------|
| `--bg` `--bg2` | page + secondary background |
| `--surface` `--surface2` | card surfaces (glass) |
| `--border` `--border2` | dividers / bright borders |
| `--text` `--dim` `--dim2` `--bright` | text ramp |
| `--primary` (+`--primary-rgb`) | main accent (charts, links, fills) |
| `--secondary` `--accent` | secondary + done/highlight |
| `--red` `--yellow` `--green` | status (danger / caution / ok) |
| `--glow` | radial atmosphere wash |
| `--mono` `--sans` | fonts |

> **Tier 1 (don't touch):** `themes/seo-tokens.css` holds the canonical brand-service colors
> (GA4 orange, GSC blue, Cloudflare, PageSpeed, etc.). Those are real vendor brand values —
> the SEO profile uses them so logos/labels read correctly. Reskin Tier 2 only.

## How to apply a theme

**Easiest (file://-safe):** copy your chosen theme's `:root` + `[data-theme="light"]` blocks
into the `<style>` at the top of `dashboard.html`, replacing the existing Tier-2 block.

**Or link it** (works when served over HTTP):
```html
<link rel="stylesheet" href="themes/my-theme.css">  <!-- after the inline base block -->
```

## Included themes

- **plasma-green.css** — default. Neon charcoal-green; matches the JenniNexus dashboard family.
- **midnight-blue.css** — the original cool indigo/blue starter look.
- **aurora-borealis.css** — iridescent turquoise/purple/pink on holographic-glass dark.
  Bold + beautiful; ships optional `.holo-text` / `.holo-border` shimmer effects. Used by
  the personal-loan **Kat** dashboard (`Finances/Loans/Kat/kat.html`). Sourced from
  syna-theme-kit "Aurora Borealis" + "Holographic Glass".

## More palettes

The full curated set (Aurora, Void Circuit, Synthwave, Ocean Breeze, Forest Depths, Midnight
Depths, Martian Games, Neon Decay) lives in **www-theme-kit**:
`tokens/dashboard-palettes.json` + `DASHBOARD-PALETTE-GUIDE.md`. Copy any palette's `colors`
into the token contract above to reskin.

## Make your own

```css
:root{
  --primary:#yourcolor; --primary-rgb:r,g,b;
  --secondary:#youraccent; --accent:#yourhighlight;
  --bg:#yourbg; --bg2:#yourbg2; --glow:rgba(r,g,b,.12);
}
```
Keep `--primary-rgb` in sync with `--primary` (used for `rgba()` glows).
