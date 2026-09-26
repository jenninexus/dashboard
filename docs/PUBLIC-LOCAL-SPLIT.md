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
| Disposable private/product experiments | `_private/`, `.private/`, `paid-app/`, `product-app-private/` |
| Local QA/build evidence | `coverage/`, `test-results/`, `playwright-report/`, `.nyc_output/` |

Run `npm run check:public-boundary` before committing. It verifies representative ignore rules and
fails if a generated/private quarantine path is already tracked.

## Private code that needs commits

Do **not** use a "local-only" branch in this public repository for paid, private, or household code.
The commits remain part of the same object database and can be pushed, mirrored, bundled, or disclosed
accidentally.

- Disposable uncommitted experiments may use one of the ignored quarantine folders above.
- Private work that needs Git history belongs in a separate sibling repository outside this checkout.
- That sibling starts with **no remote**. Adding a private remote is a later explicit product/security
  decision; adding a public remote is a separate publication task.
- The public dashboard updater, CLI, launcher, and local wizard remain the free foundation. A future
  paid shell may consume their public contracts but must not fork or hide required seed behavior.

## Product surfaces

```
PUBLIC — seed kit (profiles + themes + scaffolder + fictional examples)
PRIVATE — my-dashboard/ + .env + real metrics
PAID / APP later (hypothesis) — hosted multi-profile dash shell using the same token system
             (www-theme-kit/profiles/dashboard.json stays private kit infra)
```

The hypothesis is not authorization to implement or list a paid app. First finish and QA the public
four-profile workflow with fictional data. Then make a separate product decision covering thesis,
privacy, packaging, price, fulfilment, and repository/remote policy.

The public `profiles/finances` example uses this repo’s seed theme (`themes/`, emerald/plasma
example data). The household `/fin` dashboard (`<finances-dir>\fin.html`, palette
`aurora-finance`) is a **separate local file** and must never be copied into this repo.

The order is fixed: implement and verify in this public repo with fictional fixtures first; only after
the full offline, security, accessibility, SynQA, and human-simulated gates pass may a separate `/fin`
task evaluate household adoption. Passing the public seed does not itself authorize touching the
Finances workspace.

Three public-or-local finance surfaces:

| Surface | Where | Job |
|---|---|---|
| `profiles/finances` | this repo | Public snapshot demo (Alex Rivera) |
| [jenninexus/fin](https://github.com/jenninexus/fin) | sister GitHub repo | Public operational workspace seed |
| `fin-local` | `<finances-dir>` | Household production — never GitHub |

Palette registry (private kit): `www-theme-kit/profiles/dashboard.json` → `profiles.finances` vs `profiles.fin-local`.

Sister content tracker: [jenninexus/senior-pet-care](https://github.com/jenninexus/senior-pet-care) (Markdown) pairs with `profiles/pets` here.

## Related

- [`AGENTS.md`](../AGENTS.md) § Private vs public
- [`getting-started.md`](getting-started.md)
- [`profiles/README.md`](../profiles/README.md)
