# Identity embeds — portraits and banners

`themes/embed-identity.css` is a theme-agnostic component set for the two images almost every
dashboard ends up wanting:

| Piece | What it is | Rendered size | Source art |
|---|---|---|---|
| **Portrait** (`--embed-avatar`) | Circular avatar, `object-fit: cover` | 54px (44px ≤767.98px) | 512×512 square, ~30–60 KB |
| **Banner** (`--embed-banner-h`) | Wide art behind the identity block, gradient-faded so text stays readable | 168px tall, any width | 1600×600, ~150–250 KB |

It ships **no images**. You point it at your own art, and the palette comes from whatever the
dashboard already defines (`--dash-accent`, `--plasma`, `--border`, `--text`, `--mono`), with
fallbacks so an un-themed page still looks deliberate.

## Markup

```html
<link rel="stylesheet" href="themes/embed-identity.css">
<!-- only when you want a different accent than the theme's -->
<style>:root { --embed-accent: #a855f7; }</style>

<div class="embed-card">
  <div class="embed-banner">
    <img src="assets/hero-1600.jpg" alt="">
    <div class="embed-id">
      <img class="embed-avatar" src="assets/avatar-512.jpg" alt="Fin Technica">
      <div class="embed-id-text">
        <div class="embed-name">Fin Technica</div>
        <div class="embed-role">studio agent · daily overview</div>
      </div>
      <span class="embed-tag">delivered</span>
    </div>
  </div>
  <div class="embed-body">
    <div class="embed-message">
      1 message needs a look · 1 sent · both accounts scanned.
      <div class="embed-stamp">Nov 9, 6:00 PM</div>
    </div>
  </div>
</div>
```

Portrait without a banner:

```html
<div class="embed-inline">
  <img class="embed-avatar" src="assets/avatar-128.jpg" alt="">
  <div class="embed-id-text"><div class="embed-name">Fin Technica</div>
  <div class="embed-role">studio agent</div></div>
</div>
```

## Rules that keep this safe

1. **Never commit personal art.** Real portraits and bespoke scenes go in a git-ignored folder
   next to the dashboard (`Storage/Assets/<agent>/`), or in `docs/images/` here only when the art
   is public and licensed. This repository ships CSS, never a face.
2. **Local dashboards link a relative path.** `file://` pages can load a sibling image directly;
   add `background: #0a0d16` (already in the component) so a missing file degrades to a dark band
   instead of a white flash.
3. **Self-contained contexts inline a data URI.** A notification, an emailed card, or a widget
   pasted into another page cannot reach a local path. Inline a 128–256px JPEG at q80 (6–20 KB) and
   keep the CSP's image source at `data:` only — see Syqo's `docs/alerts/SETUP.md` for that
   contract.
4. **Crop for the frame, not the file.** The banner is `cover`-cropped to 168px from the centre
   32%; export it already composed for a wide band (face off to one side, room for the identity
   block bottom-left) rather than a square hero with the subject centred.
5. **Alt text on the portrait only.** The banner is decorative (`alt=""`); the portrait is the
   identity, so name it.

## Where the art actually lives today

| Dashboard | Art | Location |
|---|---|---|
| Finances (`fin.html`) — Daily report card | Fin Technica portrait + studio banner | `Storage/Assets/fin-technica/` in the private workspace (git-ignored) |
| Kat loan dashboard | Baked-in base64 portraits and scene | `Loans/Kat/kat.html` (self-contained, shared with Kat) |
| Ruben loan dashboard | Same pattern | `Loans/Ruben/ruben.html` |
| Syqo compact alert | Portrait read from the local alert-action registry | `.user/data/alert-actions.json` → `avatar` |

Those three dashboards bake base64 into the HTML because they are **handed to a person** — one
file, no folder to lose. That is the right call for a gift; it is the wrong call for a working
dashboard you iterate on, which is why the component here links files and only inlines when the
context demands it.
