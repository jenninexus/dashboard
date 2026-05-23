# SEO Dashboard

A self-contained, single-file SEO & analytics dashboard template. Drop in your own data and ship a polished client-ready report — no build step, no framework, no backend.

![Dark mode dashboard preview](docs/preview-dark.png)

---

## What it is

A static HTML dashboard that renders GA4, Google Search Console, PageSpeed, and Cloudflare data into charts, gauges, and scorecards. Everything runs in the browser. Your data lives in one JSON file.

**Built for:**
- Freelancers presenting monthly SEO reports to clients
- Agencies documenting site health over time
- Developers tracking their own portfolio or product site
- Anyone who wants a beautiful alternative to copying numbers into a spreadsheet

---

## Quick start

```bash
git clone https://github.com/your-username/seo-dashboard.git
cd seo-dashboard
```

Open `data/example-site.json` and replace the example values with your real data.

Then open `dashboard.html` in your browser — no server required.

```bash
# macOS / Linux
open dashboard.html

# Windows
start dashboard.html
```

---

## How to use your own data

All dashboard content is driven by `data/example-site.json`. The file is thoroughly commented — every field explains what it expects.

### Minimal setup (swap these first)

```jsonc
"site": {
  "name":        "Your Site Name",
  "domain":      "yourdomain.com",
  "url":         "https://yourdomain.com",
  "dataAsOf":    "2026-05-23"
},
"ga4": {
  "last30Days": { "activeUsers": 0, "sessions": 0, ... }
},
"searchConsole": {
  "last90Days": { "totalClicks": 0, "totalImpressions": 0, ... }
}
```

### Impressions trend chart

The `impressionsTrend` block drives the 6-month growth chart. Add one number per month, oldest first. Use `null` for months with no data (shows as a gap in the line):

```jsonc
"impressionsTrend": {
  "labels": ["Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25"],
  "data":   [120, 180, null, 340, 520, 810],
  "milestones": {
    "1": "Blog launch",
    "5": "Schema markup added"
  }
}
```

Milestone keys are zero-based indices into the `labels` array. They render as gold annotation lines on the chart.

### Action items

Four priority levels: `"critical"`, `"high"`, `"medium"`, `"done"`. Done items move to a collapsed "Completed" bucket automatically.

```jsonc
{ "priority": "critical", "item": "Fix mobile LCP", "impact": "PageSpeed +15pts" },
{ "priority": "done",     "item": "Add canonical URLs", "impact": "" }
```

---

## Branding / theming

The token system follows the same Tier 1 / Tier 2 pattern used by `www-theme-kit`:

| Tier | File | What to do |
|------|------|------------|
| **Tier 1** — SEO service colors | `tokens/seo-dashboard-tokens.css` | Never override — these are canonical Google/Cloudflare/etc brand values |
| **Tier 2** — Dashboard structure | `tokens/seo-dashboard-tokens.css` | Override in your own brand file using the template below |

### Brand override template

Create `tokens/my-brand.css` and paste only the tokens you want to change:

```css
:root {
  --dash-primary:       #your-color;
  --dash-primary-rgb:   r, g, b;          /* required for rgba() usage */
  --dash-secondary:     #your-accent;
  --dash-accent:        #your-highlight;
  --dash-font-body:     'Your Font', sans-serif;
}
```

Then add `<link rel="stylesheet" href="tokens/my-brand.css">` after the base token import in `dashboard.html`.

### Light / dark mode

The dashboard ships dark by default. Toggle with the sun/moon button in the header — preference is saved to `localStorage`.

Theme switching is done via `data-theme` on `<html>` (not `<body>`), which avoids the CSS cascade trap where body-level overrides can bleed into child elements before the attribute propagates.

---

## Multi-site tabs

The dashboard supports multiple sites in a single file. Each tab is a `<section class="tab-pane" data-tab="...">` block. The tab switcher is generated automatically from `data-tab-label` attributes.

To add a second site: duplicate the tab pane block, give it a new `data-tab` ID, and update the data. Useful for agencies managing several clients in one shareable document.

---

## File structure

```
seo-dashboard/
├── dashboard.html          # The entire dashboard — open this
├── data/
│   └── example-site.json  # Your data goes here
├── tokens/
│   └── seo-dashboard-tokens.css  # Design token contract (Tier 1 + Tier 2)
├── docs/                   # Screenshots, guides
├── resources/
│   └── svgs/              # Optional custom icons
├── package.json
└── .gitignore
```

Everything runs from `dashboard.html`. The token file and data file are the only external dependencies.

---

## What the dashboard shows

| Section | Data source |
|---------|-------------|
| **6-Month Progress** | `impressionsTrend` + KPI deltas computed from `ga4` / `searchConsole` |
| **GA4 Summary** | `ga4.last30Days` vs `ga4.previousPeriod` |
| **Traffic Sources** | `trafficSources` array → doughnut chart |
| **Top Pages** | `topPages` array → sortable table |
| **GSC Coverage** | `searchConsole` indexed/not-indexed counts + top query |
| **PageSpeed** | `pagespeed.mobile` + `pagespeed.desktop` → circular gauges |
| **On-Page SEO** | `seoFeatures` array → pass/warn/fail table |
| **Action Plan** | `actionItems` → bucketed by priority |
| **Site Milestones** | `milestones` array → horizontal timeline |

---

## Dependencies

All loaded via CDN — no npm install needed.

| Library | Version | Why |
|---------|---------|-----|
| [Chart.js](https://www.chartjs.org/) | 4.4.4 | Line, bar, doughnut charts + custom milestone annotations |
| [DM Mono](https://fonts.google.com/specimen/DM+Mono) | — | Mono font for labels, metrics, code |
| [Syne](https://fonts.google.com/specimen/Syne) | — | Display font for headings |

No React, no build step, no `node_modules`.

---

## Extending the dashboard

### Adding a new chart

1. Add a `<canvas id="myChart">` inside a `.chart-container` div
2. In the script block at the bottom of `dashboard.html`, initialize with `new Chart(document.getElementById('myChart'), {...})`
3. Pull data from the JSON constants already parsed at the top of the script block

### Adding a new data field

1. Add the field to `data/example-site.json` with a `_comment` explaining what it means
2. Reference it in `dashboard.html` via the `D` constant: `D.yourField`

### Custom milestone annotations

The `milestonePlugin` is a Chart.js plugin registered inline. It reads `impressionsTrend.milestones` from the JSON and draws vertical dashed gold lines with label boxes at the correct data indices. To customize: find `const milestonePlugin` in `dashboard.html` and adjust `lineColor`, `labelBg`, and font size.

---

## License

MIT — use it, fork it, sell it, ship it. No attribution required (but appreciated).
