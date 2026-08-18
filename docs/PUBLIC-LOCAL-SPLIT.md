# Public vs local split — dashboard

This repository is a **public dashboard seed kit**. Tracked profiles ship **fictional**
sample data only. Real numbers, API keys, and generated `my-dashboard/` output stay local.

Sibling pattern: [`agency/docs/PUBLIC-LOCAL-SPLIT.md`](../../agency/docs/PUBLIC-LOCAL-SPLIT.md) ·
[`pdf-designer/docs/PUBLIC-LOCAL-SPLIT.md`](../../pdf-designer/docs/PUBLIC-LOCAL-SPLIT.md).

## Track public

| Surface | Path |
|---|---|
| Profiles + example JSON | `profiles/{seo,finances,health,pets}/` |
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

The public `profiles/finances` example uses this repo’s seed theme (`themes/`, emerald/plasma
example data). The household `/fin` dashboard (`D:\Documents\Finances\fin.html`, palette
`aurora-finance`) is a **separate local file** and must never be copied into this repo.

Three public-or-local finance surfaces:

| Surface | Where | Job |
|---|---|---|
| `profiles/finances` | this repo | Public snapshot demo (Alex Rivera) |
| [jenninexus/fin](https://github.com/jenninexus/fin) | sister GitHub repo | Public operational workspace seed |
| `fin-local` | `D:\Documents\Finances` | Household production — never GitHub |

Palette registry (private kit): `www-theme-kit/profiles/dashboard.json` → `profiles.finances` vs `profiles.fin-local`.

Sister content tracker: [jenninexus/senior-pet-care](https://github.com/jenninexus/senior-pet-care) (Markdown) pairs with `profiles/pets` here.

## Related

- [`AGENTS.md`](../AGENTS.md) § Private vs public
- [`getting-started.md`](getting-started.md)
- [`profiles/README.md`](../profiles/README.md)
