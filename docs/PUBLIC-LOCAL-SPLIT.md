# Public vs local split — Dashboard

This repository is a public, local-first dashboard seed kit. Tracked profiles contain fictional
sample data only. A user's generated dashboard, real data, secrets, plans, and QA evidence stay local.

## Public product surface

| Surface | Path | Why it is public |
|---|---|---|
| Profile renderers and fictional examples | `profiles/{seo,finances,health,pets}/` | The four complete domain examples and their versioned editor contracts |
| Theme tokens | `themes/*.css` | Vendored, self-contained public palette contract |
| Scaffolder and updater | `scripts/` | Zero-dependency creation, validation, and safe local updates |
| Contributor capture configuration | `configs/` | Reproducible optional screenshot tooling without machine-specific paths |
| Runtime profile art | `docs/images/` | Assets referenced by profile HTML and copied into generated output |
| Curated README gallery | `docs/screenshots/hero/` | One public hero image per profile |
| User and contributor guidance | `README.md`, `AGENTS.md`, `docs/*.md` | Durable behavior, architecture, safety, and extension contracts |
| Example AI commands | `.claude/commands.example/*.md.example` | Optional finance commands to copy into your own clone's ignored `.claude/commands/` (drop the `.example` suffix) |

The committed repository must be sufficient to scaffold, update, and open every profile. It must not
require a private theme kit, another local checkout, an AI account, API keys, a backend, or internet
access for the core data and navigation experience.

## Local-only surface

| Surface | Ignored path |
|---|---|
| Generated dashboard and personal data | `my-dashboard/` |
| Secrets and optional local configuration | `.env*` except public `*.example` templates |
| Execution plans | `Plans/` |
| Retired/unsupported agent handoffs | `dev-chat.md`, `dev-log.yaml` |
| Agent/editor state | `.codex/`, `.claude/` (except `.claude/commands.example/`), `*.code-workspace` |
| Scratch and capture staging | `_scratch/`, `storage/` |
| Private experiments | `_private/`, `.private/`, `paid-app/`, `product-app-private/` |
| Test and browser evidence | `coverage/`, `test-results/`, `playwright-report/`, `.nyc_output/` |
| Full breakpoint screenshot sweeps | `docs/screenshots/` outside `docs/screenshots/hero/` |

Real financial, health, pet-care, or analytics exports are never fixtures. Put them only in the
generated dashboard's ignored `data.json`; do not paste them into profile examples, plans, screenshots,
tests, issue reproductions, or documentation.

## Why Plans and agent logs are local

Plans often contain transient machine paths, internal coordination, incomplete ideas, and facts about
other workspaces. This project uses ignored `Plans/_active/` for live execution and
`Plans/_complete/` for local history. It does not use root `dev-chat.md` or `dev-log.yaml` files.

Before completing a plan, promote every fact a public user or contributor needs into `README.md`,
`AGENTS.md`, or the relevant `docs/` page. This keeps the public product self-contained without
publishing private coordination history.

## Private code that needs history

An ignored directory or a "local-only" branch is not a privacy boundary once content enters this
repository's Git object database. Disposable, uncommitted experiments may use the ignored quarantine
folders. Private work that genuinely needs commits belongs in a separate sibling repository with no
remote until a later, explicit security and publication decision.

The public updater, CLI, and profile contracts remain the foundation. Private or commercial work may
consume those public contracts later, but cannot replace, hide, or weaken the public behavior.

## Finance boundaries

The public finances profile is a fictional customizable snapshot. It is distinct from any
person's local household workspace. Passing this repository's tests never authorizes reading or
migrating household records.

## Verification

Run `npm run check:public-boundary` before committing. It verifies representative ignore rules,
ensures required public samples remain trackable, and rejects tracked local/private/generated paths.
Also review `git diff --cached --name-only` before pushing; an ignore rule cannot protect content that
is already tracked.

## Related

- [`AGENTS.md`](../AGENTS.md)
- [`getting-started.md`](getting-started.md)
- [`profile-system.md`](profile-system.md)
- [`profiles/README.md`](../profiles/README.md)
