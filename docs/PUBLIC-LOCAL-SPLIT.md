# Public vs local split — dashboard

This repository is a **public dashboard seed kit**. Tracked profiles ship **fictional**
sample data only. Real numbers, API keys, and generated `my-dashboard/` output stay local.

Sibling pattern: [`agency/docs/PUBLIC-LOCAL-SPLIT.md`](../../agency/docs/PUBLIC-LOCAL-SPLIT.md) ·
[`pdf-designer/docs/PUBLIC-LOCAL-SPLIT.md`](../../pdf-designer/docs/PUBLIC-LOCAL-SPLIT.md).

## Track public

| Surface | Path |
|---|---|
| Profiles + example JSON | `profiles/{seo,finances,health}/` |
| Themes | `themes/*.css` |
| Docs | `docs/getting-started.md` · `architecture.md` · `profile-system.md` · `finances-profile.md` |
| Scaffolder | `scripts/build-dashboard.mjs` |
| Agent map | `AGENTS.md` |

## Keep local

| Surface | Path |
|---|---|
| Generated user dashboard | `my-dashboard/` |
| Secrets / optional API keys | `.env` (see `.env.example`) |
| Real financial / health / SEO dumps | never commit — paste into local `data.json` only |

## Product surfaces

```
PUBLIC — seed kit (profiles + themes + scaffolder + fictional examples)
PRIVATE — my-dashboard/ + .env + real metrics
PAID / APP later (hypothesis) — hosted multi-profile dash shell using the same token system
             (www-theme-kit/profiles/dashboard.json stays private kit infra)
```

## Theme kit

Canonical `--dash-*` tokens live in **`www-theme-kit`** (`profiles/dashboard.json` +
`tokens/dashboard-tokens.css`). That kit is **not** a public product — copy tokens into
this repo’s `themes/` for the open seed.

## Related

- [`AGENTS.md`](../AGENTS.md) § Private vs public
- [`getting-started.md`](getting-started.md)
