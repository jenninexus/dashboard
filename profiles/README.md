# Profiles

A **profile** = what your dashboard tracks. The seed ships a generic shell + theme; a profile
adds the sections, data schema, and example data for a domain.

| Profile | Status | What it tracks |
|---------|--------|----------------|
| [**seo**](seo/) | ✅ ready | GA4, Search Console, PageSpeed, Cloudflare — client SEO reports |
| [finances](finances/) | 🚧 planned | Cash vs obligations, bills, loans, income (the fin.html toolkit) |
| [health](health/) | 🚧 planned | Custom metrics — weight, sleep, labs, habits, appointments |

Each profile folder has:
- `profile.json` — manifest: id, sections, theme, data-schema pointer, status
- `example-data.json` — the data schema, field-by-field with comments

## Use a profile

```bash
npm run build-dashboard -- --profile seo --name "Acme Studio"
```
…or ask an AI agent: **"set up the SEO dashboard for acme.com"** (see `../AGENTS.md` +
`.claude/commands/build-dashboard.md`). The scaffold copies the profile's example data to
`my-dashboard/`, stamps your name/site, and points `dashboard.html` at it.

## Add your own profile

1. `cp -r profiles/seo profiles/<yourprofile>` (or scaffold a blank one)
2. Edit `profile.json` — id, name, sections, theme
3. Define `example-data.json` — your fields, each with a `_comment`
4. Add sections/charts to `dashboard.html` (or a profile-specific render file)
5. Add a row to the table above

> Design components to reuse across profiles: progress bars (shimmer + % badge), gauges,
> doughnut/line charts, collapsible foldouts, status chips. The SEO + finances profiles share
> the same primitives — keep them generic.
