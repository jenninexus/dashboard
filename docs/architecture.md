# Architecture

This page is the deeper "how it works" for people who want to extend the kit. The root README
is the elevator pitch — start there if you haven't.

## Tech stack

- **Plain HTML/CSS/JS** — each profile is a single self-contained `.html` file (inline `<style>` + inline `<script>`). No framework, no bundler, no build step.
- **[Chart.js](https://www.chartjs.org/)** (via CDN `<script>` tag) — renders trend lines, doughnuts, and gauges inside each dashboard.
- **Google Fonts** (`Outfit`, `JetBrains Mono`, via `<link>` `preconnect`) — the only external network calls a dashboard makes when opened normally.
- **Node.js 18+** — only needed to run the scaffolder (`scripts/build-dashboard.mjs`), not to view a dashboard.
- **PowerShell 7 + [vid-scroll](https://github.com/monofinitystudio/vid-scroll)** — optional screenshot tooling (see [Screenshots](#screenshots)).

## Dependencies

The dashboards themselves have **zero installed dependencies** (`package.json` declares none) — everything runs from `file://` with no `npm install`.

| Dependency | Where | Purpose |
|---|---|---|
| Chart.js | CDN `<script>` in each profile HTML | Charts/gauges/trend lines |
| Google Fonts | CDN `<link>` in each profile HTML | `Outfit` / `JetBrains Mono` type |
| Node.js 18+ | `scripts/build-dashboard.mjs` | Zero-dep scaffolder (uses only `node:fs`, `node:path`, `node:url`) |
| ffmpeg | `scripts/capture.ps1` (optional) | WebP encoding for screenshot captures |

## Integrating with the rest of your tools

This repo intentionally stays alone. You can freely fork it to wire your own:

- **AI coding agents** — point Claude Code, Copilot, Cursor, or Gemini at the repo and ask them to customize a profile.
- **Static hosts** — GitHub Pages, Netlify, Cloudflare Pages, Vercel, S3, anywhere that serves static files works. Drop `profiles/<id>/<id>.html` + `themes/` into your page and you're done.
- **vid-scroll** — use this repo's `configs/breakpoints.json` as a starting point if you want a multi-breakpoint screenshot sweep of your dashboards.

## Screenshots

Two configs are bundled:

- **`configs/breakpoints.json`** — multi-breakpoint sweep (mobile 390 / tablet 768 / desktop 1280) for QA.
- **`configs/hero-screenshots.json`** — single 1920×1080 (16:9) hero shot per profile, used for the README gallery.

Run with the bundled `scripts/capture.ps1` (which delegates to vid-scroll) or directly:

```bash
npx tsx <path-to-vid-scroll>/src/cli.ts \
  --breakpoints configs/hero-screenshots.json \
  --local \
  --output docs/screenshots/hero \
  --no-cursor
```

Outputs land in `docs/screenshots/hero/<width>/<slug>-<width>.png`.

## Env / config (all optional)

The dashboard needs **none of these to run.** Everything below is optional, only used by
AI agents you point at this repo, or by future profiles that automate live data fetches.

| Variable | Purpose |
|---|---|
| `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `PAGESPEED_API_KEY`, `CLOUDFLARE_API_TOKEN` | Reserved for a future automated SEO profile fetch — unused today (SEO profile is hand-fed JSON) |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | Only if you point a local AI agent at this repo to customize/extend a dashboard |

Copy `.env.example` → `.env` and fill in only what you use. Names only, no values are ever committed.

## Repo conventions

- **Profile config files** are named `profile.json` (not `seo.json` / `finances.json` / `health.json`). Example HTML files are named after the profile (`seo.html`, `finances.html`, `health.html`).
- **Tier-1 brand-service colors** in `themes/seo-tokens.css` are canonical vendor values — don't change them.
- **Fonts** are `Outfit` (UI / display) + `JetBrains Mono` (numerals + code blocks), both with system fallbacks.