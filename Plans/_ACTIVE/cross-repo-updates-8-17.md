# Cross-repo updates — 2026-08-17

**Status:** In progress — Phase 0–1 + pets profile landed 2026-08-17 in dashboard / fin / senior-pet-care. Theme-kit + brand-theme-kit still open.  
**Owner:** dashboard + sister public seeds + theme kits  
**Scope:** `dashboard` · `fin` · `senior-pet-care` · `www-theme-kit` · `syna-theme-kit` · `syn-themes` · optional new public theme-kit starter  
**Out of scope:** copying `D:\Documents\Finances` (or any real amounts) into GitHub. Local `/fin` stays local.

This plan answers: keep `fin` as its own repo? what belongs in the dashboard seed? how should themes flow? what to do with senior-pet-care and a possible public theme-kit starter?

---

## 0. Decisions (read this first)

| Question | Recommendation | Why |
|---|---|---|
| Keep `C:\Github\fin` in addition to dashboard? | **Yes. Keep it. Do not merge or delete.** | Different product. Dashboard is a *profile seed kit*. `fin` is an *operational finance workspace* (bills, autopay, archive, AI commands, PowerShell pipeline). |
| Extract finances out of dashboard? | **No.** Keep `profiles/finances` as the public snapshot demo. | “Make one dashboard. For everyone.” needs a money profile. Finance is one of the three most-forked dashboard use cases. Extracting it weakens the kit. |
| If we *did* extract finances and still want exactly 3 profiles? | Replace with **`pets` / senior-pet**. | Already have a public sister repo + story + blog. Health is human-specific (fitness, sleep, macros) and does not cover QoL / fluids / litter / red flags. |
| Better than extracting? | Keep the current 3, then **add `pets` as a 4th** when ready. | No loss of the finances demo. senior-pet-care gets a real visual sister. Kit grows instead of shrinking. |
| Where do themes get authored? | **By stack, not one mega-kit.** See §5. | syna = React accents. www = standalone HTML `--dash-*`. syn-themes = VS Code chrome + storefront mirror. dashboard `themes/` = public copy. |
| New public theme-kit starter repo? | **Yes — later, as `brand-theme-kit` (or `theme-kit-seed`).** Not a 3rd production kit. | Teach people to make *their* brand kit. Do not compete with `www-theme-kit` / `syna-theme-kit`. |
| senior-pet-care GoFundMe? | **Remove the fundraiser link. Link the blog instead.** | `https://jenninexus.com/blog/senior-cat-care` |

**Hard rule (already in `docs/PUBLIC-LOCAL-SPLIT.md`):** household `D:\Documents\Finances\fin.html` (palette `aurora-finance`) and Kat / Ruben / AgentGarbo HTML never enter a public repo. Public finances = fictional Alex Rivera (dashboard) or `[example]` workspace (fin).

---

## 1. Three finance surfaces (they are not the same thing)

```
PUBLIC TEMPLATES                          PRIVATE PRODUCTION
─────────────────                         ──────────────────
C:\Github\dashboard                       D:\Documents\Finances
  profiles/finances/                        fin.html + split JSON SSOTs
  emerald-finance snapshot                  aurora-finance
  holdings / loans / YTD                    bills · income · loans · legal · funding
                                            npm run finance:update
                                            NEVER GitHub

C:\Github\fin
  standalone workspace template
  plasma-green / Metrica
  bills · deadlines · autopay · archive
  last commit 2026-05-19 (stale vs local)
```

| Dimension | Local `/fin` (`D:\Documents\Finances`) | `C:\Github\fin` | Dashboard `profiles/finances` |
|---|---|---|---|
| Role | Real household OS | Public *workspace* seed | Public *snapshot* seed |
| Visibility | LOCAL ONLY | Private GitHub today; intended as cloneable template | Public MIT kit slice |
| Freshness | Active (2026-08) | Frozen May 2026 | Active HTML, broken scaffolder metadata |
| Data | Split: `bills.json`, `income.json`, `accounts.json`, `expenses.json`, `workspace.json`, `archive.json` | Single `workspace.json` → generated `workspace-data.js` | Inline `<script id="fin-data">` + `example-data.json` (schemas currently disagree) |
| Pipeline | `npm run finance:update` + validator | `startup-session.ps1` only | `build-dashboard.mjs` (paths currently wrong) |
| Theme | `aurora-finance` (aurora on true black, plasma-green title accents kept) | Plasma Green inline (`#040704` / `#00e879`) | Emerald Finance in HTML (`#10b981` / `#f59e0b`); manifest still says `plasma-green` |
| Unique features | Loans, funding, Chase, Handshake, expenses, 15+ AI commands | Autopay 3-state badges, ADHD pinned todos, markdown Action Plan parse, archive | Holdings coverage bars, loan foldouts, net-worth-style KPIs |
| Missing vs the others | — | No holdings/loans/YTD; README promises dirs/scripts that are not in the repo | No autopay engine, no archive, no startup terminal |

**Do not try to make these one file.** Shared DNA is: single HTML, JSON in, `file://`, no backend, dark glass. Everything else should stay specialized.

### Why keep `fin` as its own repo

1. **Different job.** Dashboard answers “show me a pretty snapshot from JSON.” `fin` answers “run a daily money workspace” (accrue, validate, archive, escalate autopay, print a terminal briefing).
2. **Different clone story.** Someone who wants a finance OS should clone `fin`, not a 3-profile kit and delete SEO/health.
3. **Privacy story is clearer** when the finance-specific repo is the one that says “real data never leaves your machine.”
4. **Local `/fin` already evolved past the public template.** The GitHub repo is the *publicable subset* of that idea — it should be refreshed to stay a good fork, not absorbed into dashboard.
5. **Dashboard stays general.** SEO + money + body is a coherent “life/work kit.” Turning dashboard into “everything except money” makes the kit worse.

### What `fin` should become (refresh, don’t merge)

Positioning line:

> **fin** is the operational personal-finance workspace seed. **dashboard** is the generic profile kit. `fin` *draws styles from* dashboard / www-theme-kit. It is not a dashboard profile.

Refresh list (no personal data):

- Add `LICENSE` (MIT is claimed, file missing).
- Fix README file tree vs reality (`bills/car/`, `taxes/2024/`, `scripts/sync-sheets.js`, Metrica images are promised and absent). Either ship stubs or stop promising them.
- Add `package.json` + `npm run start` that wraps `startup-session.ps1` (Windows-first, document the pwsh path).
- Pull `:root` from `dashboard/themes/plasma-green.css` (or a generated `--dash-*` block) instead of a hand-forked inline palette. Keep fin-only tokens (`--card-accent`, autopay badge colors).
- Document the three-surface split in `fin/README.md` and `dashboard/docs/PUBLIC-LOCAL-SPLIT.md` (already started; commit the uncommitted split doc).
- Optional later: port *sanitized* ideas from local `/fin` (split JSON, validator, archive card) as *example-only* features — never amounts, never people names.
- Do **not** vendor local `aurora-finance`. That look is household-only.

`www-theme-kit/profiles/dashboard.json` already encodes this: `profiles.finances` (public seed) vs `profiles.fin-local` (D: drive). Keep that map; add a pointer to `C:\Github\fin` as `profiles.fin-template`.

---

## 2. Three public product repos — make each distinct

```
dashboard              generic visual seed kit
  seo · finances · health  [+ pets later]
  themes/  scaffolder  fictional data
        │
        │  copy tokens / card patterns
        ▼
fin                    operational finance workspace seed
senior-pet-care        printable Markdown pet-care tracker
                       (+ optional pets dashboard profile in dashboard)
```

| Repo | Public job | Draws from | Must never contain |
|---|---|---|---|
| **dashboard** | Profile kit + themes + scaffolder | `www-theme-kit` tokens (copied into `themes/`) | Real SEO/finance/health dumps; local fin.html; Alice’s real vet phones if we add pets |
| **fin** | Finance *workspace* template | dashboard `plasma-green` / `--dash-*` | Household amounts, loan names, Chase docs |
| **senior-pet-care** | Print-first Markdown tracker | dashboard health/pets *patterns* (not a second theme system) | Live GoFundMe CTA; un-anonymized clinic phones if we claim “anonymized” |

### Bidirectional links (missing today)

| From | To | Today | Do |
|---|---|---|---|
| senior-pet-care README | dashboard | One paragraph, generic | Point at `profiles/health` now, `profiles/pets` when it exists |
| dashboard | senior-pet-care | **None** | Add a “Sister trackers” blurb in README + health/pets docs |
| senior-pet-care | blog | **None** | `https://jenninexus.com/blog/senior-cat-care` |
| dashboard | fin | Indirect via PUBLIC-LOCAL-SPLIT | README: “Want a full finance workspace? → jenninexus/fin” |
| fin | dashboard | None | “Want holdings/loans snapshot UI or another domain? → jenninexus/dashboard” |
| blog | both | Agency notes say the post exists | Confirm the live post links the tracker repo |

---

## 3. Dashboard profiles — keep 3, improve them, add pets later

### 3.1 Recommended lineup

**Now (keep):**

| Profile | Theme (actual HTML) | Job |
|---|---|---|
| **seo** | Aurora SEO — `#070b14` / `#4d9fff` / `#00f5d4` / `#9b72ff` | Client-ready analytics report |
| **finances** | Emerald Finance — `#10b981` / `#f59e0b` | Cash vs obligations snapshot |
| **health** | Vitality Health — `#7c9ef8` / `#2dd4bf` / `#c084fc` | Human wellness |

**Next (add, do not replace):**

| Profile | Theme | Job |
|---|---|---|
| **pets** (id: `pets` or `senior-pet`) | Warm dusk / soft amber-teal — *new* profile palette, not a clone of vitality-health | Senior pet care visual layer for the Markdown tracker |

**If we are forced to stay at exactly 3 and extract finances:** drop finances from dashboard (leave a pointer to `fin`) and ship **pets** as the third. That is the only replacement that is both useful and already has a sister repo + blog. Runner-up: **habits** (streaks/goals, more general than health). Do not replace with another analytics clone or a vague “projects” profile.

### 3.2 Shared kit bugs (fix first — all profiles)

These are blocking the product, not taste:

1. **Scaffolder is broken.** Every `profile.json` `render` path is wrong.
   - seo / health point at root `dashboard.html` (does not exist).
   - finances points at `profiles/finances/dashboard.html` (file is `finances.html`).
   - `package.json` `"main"` and `npm run open` also point at missing `dashboard.html`.
   - **Fix:** `render` = `profiles/{id}/{id}.html`. `npm run open` → `profiles/seo/seo.html` (or `--list` then open). Convention is already documented in `www-theme-kit/profiles/dashboard.json` → `profile_file_convention`.
2. **`dataInjection` incomplete.** Only finances has `scriptId`. seo uses `seo-data`, health uses `health-data` — scaffolder will not swap them.
3. **Manifest `theme` is a lie.** All three say `"theme": "plasma-green"`. HTML uses aurora-seo / emerald-finance / vitality-health. Align `profile.json` to the real CSS id.
4. **Schema drift.**
   - seo: `example-data.json` ≠ inline `seo-data`.
   - finances: `example-data.json` ≠ inline `fin-data` (HTML is the UI truth).
   - health: example JSON ≈ HTML (good), but `profile.json` still says STUB + `plannedSections` that don’t match the built cards.
5. **Missing `docs/images/agency/*.webp`** referenced by all three HTML files. Ship placeholders or drop the banners.
6. **Docs lag.** `docs/profile-system.md` still says `dashboard.html` per profile; `profiles/README.md` is linked and missing; `docs/finances-profile.md` uses the old filename; `getting-started.md` has `profile/` vs `profiles/`.
7. **Health manifest vs product.** `status: "ready"` + `_note: "STUB — not built yet"` + no labs/habits/trends despite the description promising them.

### 3.3 Per-profile product improvements

#### SEO — keep as the flagship

**What works:** densest, most “client report” of the three. Aurora midnight is distinct and on-brand for JN analytics.

**Improve:**

- Reconcile `example-data.json` to the inline schema (or generate one from the other). One contract.
- Add `dataInjection.scriptId: "seo-data"`.
- Set `theme: "aurora-seo"`.
- Keep `themes/seo-tokens.css` Tier-1 vendor colors canonical (GA4 / GSC / PageSpeed) — do not restyle those hexes.
- Optional: a “cluster” toggle in example data (one site vs many) so the profile can demo JN *and* MG without a second profile.
- Visual: keep aurora-seo unique. Do **not** flatten it to plasma-green “for consistency.” Consistency = shared `--dash-*` chrome + collapse + breakpoints, not the same accent.

#### Finances — keep as the public money snapshot

**What works:** holdings bars, loan foldouts, bill status table. This is the *demo* of “cash vs obligations,” not the household OS.

**Improve:**

- One schema: promote the richer inline `fin-data` shape into `example-data.json` (accounts + compare, `stillOwed`, todo buckets). Comments on every field.
- `theme: "emerald-finance"`. `render: "profiles/finances/finances.html"`.
- Keep emerald/gold. It is the opposite of local aurora-finance on purpose (public seed ≠ household dash).
- README pointer: “Need autopay, archive, and a daily pipeline? Use [fin](https://github.com/jenninexus/fin).”
- Do **not** add Chase / named loans / real accounts. Fictional Alex Rivera only.
- Optional seed features worth stealing *as fiction* from `fin` (not from D:): autopay badge states, an archive card fed by `archive.example.json`. That makes the two public repos rhyme without merging them.

#### Health — finish the manifest, don’t clone pets

**What works:** vitality-health is the calmest of the three; checklist / vitals / meds / mood / goals are built.

**Improve:**

- Rewrite `profile.json`: drop STUB note; replace `plannedSections` with the sections that actually exist; add `dataInjection.scriptId: "health-data"`; `theme: "vitality-health"`; `render: "profiles/health/health.html"`.
- Description currently promises labs + habit streaks. Either **build** `labs[]` + `habits[]` (small tables / streak bars — reuse SEO gauges + finances bars) or stop promising them.
- Keep it **human**. Fitness, sleep, nutrition macros, mood emojis stay here.
- README: “Tracking a senior pet instead? Templates live in [senior-pet-care](https://github.com/jenninexus/senior-pet-care).”

#### Pets (recommended 4th profile — not a replacement unless we extract finances)

Map from senior-pet-care Markdown → JSON:

| Markdown | Dashboard section |
|---|---|
| `daily-log.md` | Today’s checklist (appetite, litter, fluids, meds) |
| `weekly-weight-log.md` | Weight trend chart |
| `medications.md` | Meds + supplements table |
| `vet-visit-history.md` | Visit timeline |
| `quality-of-life.md` | HHHHHMM 7×10 scores |
| `red-flags.md` | Static emergency card |
| `end-of-life-planning.md` | Collapsed, optional, treat carefully |

**Theme:** new `dusk-companion` (working name) — warm charcoal, amber `#f5b942`, soft teal `#2dd4bf`, rose only for red flags. Must not look like vitality-health (cool lavender) or emerald-finance. Register in `www-theme-kit/palettes/dashboard-palettes.json` then copy to `dashboard/themes/dusk-companion.css`.

**Data:** fictional public pet (not Alice’s real chart). Alice example stays in senior-pet-care `example/` and/or a *local* `my-dashboard/`. Anonymize clinic phones in the public example if we keep claiming “anonymized.”

**senior-pet-care stays Markdown-first.** The dashboard profile is the visual optional layer, not a rewrite of the tracker.

---

## 4. senior-pet-care — concrete updates

### 4.1 Fundraising / story links (do this first)

**Remove** the GoFundMe CTA in `README.md` (currently `[Alice the Wonder Cat — Senior Care Fund](https://gofund.me/850a82747)` — same campaign as `https://www.gofundme.com/f/support-alices-senior-cat-care-journey`).

**Replace with** the blog post:

```md
**Read Alice’s story:** [Senior cat care](https://jenninexus.com/blog/senior-cat-care)
```

Keep the footer Links / Patreon / PayPal as general support. Do not add a second fundraiser URL. Historical mention in `example/vet-visit-example.md` (“Funded by: Community fundraiser + CareCredit”) can stay — that is a past-tense chart note, not a CTA.

### 4.2 Repo hygiene

- Add `LICENSE` (MIT).
- Add `.gitignore` (even if mostly empty — future local notes).
- Cross-link dashboard + blog as in §2.
- Either anonymize `example/` vet clinic / phone / city **or** stop calling it anonymized.
- Example logs freeze in May 2026 — either mark the example as a *fixed snapshot* (“as of May 2026”) or refresh. Prefer a dated snapshot so the public repo does not imply live medical updates.

### 4.3 Draw from dashboard (without becoming a website)

Do **not** turn this repo into a second theme kit.

Optional later:

- `docs/DASHBOARD.md` — how to scaffold `dashboard --profile pets` (or health, until pets exists) from these Markdown fields.
- A single `example/alice.sample.json` that matches the pets profile schema, fictionalized.
- Print CSS can stay GitHub-flavored Markdown. If we add HTML, copy `dashboard/themes/` tokens; do not invent a fourth palette family here.

---

## 5. Theme SSOT — where to draw from

### 5.1 The chain (authoritative as of 2026-08-17)

```
syna-theme-kit/palettes/syna-palettes.json     AUTHOR accents for shared ids
        │
        ├─► syn-themes/palettes/all-palettes.json     STOREFRONT MIRROR (stale on martian / sg-martian / mg-website)
        ├─► syn-themes/themes/*.json                  AUTHOR VS Code chrome (6 Synagraphic themes)
        └─► www-theme-kit/palettes/dashboard-palettes.json
                derived shared ids + dashboard-only ids
                (plasma-green, aurora-seo, emerald-finance, vitality-health, aurora-finance, …)
                        │
                        ▼
            www-theme-kit/tokens/dashboard-tokens.css   AUTHOR --dash-* chrome (v1.4.0)
                        │
                        ▼
            C:\Github\dashboard\themes\*.css            PUBLIC COPY for the OSS seed
```

| You want to change… | Edit here | Then |
|---|---|---|
| Shared accent hex (aurora-borealis, void-circuit, neon-decay, midnight-depths, Synagraphic 6) | `syna-theme-kit/palettes/syna-palettes.json` | Mirror → syn-themes; derive → dashboard-palettes; regenerate CSS |
| VS Code editor chrome (title bar, tokens, syntax) | `syn-themes/themes/*.json` | Publish extension |
| Standalone HTML dashboard chrome (cards, type, collapse, breakpoints) | `www-theme-kit/tokens/dashboard-tokens.css` | Copy `:root` + components into dashboard `themes/` / profile HTML |
| Dashboard-only palette (plasma-green, aurora-seo, emerald-finance, vitality-health, dusk-companion) | `www-theme-kit/palettes/dashboard-palettes.json` | Copy into `dashboard/themes/{id}.css` |
| Local household / loan / investor dashes | Those HTML files + registry keys in `www-theme-kit/profiles/dashboard.json` | Never copy back to GitHub |
| Syna React app first-paint | `syna-theme-kit/profiles/{app}.json` + `design-tokens.ts` | Hosts vendor/inline |

**`syna-theme-kit/profiles/dashboard.json`** is *not* the OSS seed map. It is the overlay for Synabrain / Syqo / Synagen / Sylva admin panels: `--dash-*` + Syna `design-tokens.ts`. Leave it. Do not merge it with `www-theme-kit/profiles/dashboard.json`.

**Skill drift to fix when convenient:** `/theme` still says “edit `syn-themes/palettes/all-palettes.json` first.” Repos + `/syn-themes` + `/themes` agree the **kit** is authoring SSOT. Update the `/theme` command source.

### 5.2 Are dashboard themes still “inspired by syn-themes”?

Yes, but **only some**, and the names collide.

| Dashboard / www id | Synagraphic / syna cousin | Same product? |
|---|---|---|
| `aurora-borealis` | syna `aurora-borealis` | Yes — shared hex, holographic skin |
| `midnight-blue.css` | syna `midnight-depths` (`#818cf8`) | Intended yes — **drifted** (`#6C8EFF` / `#0b0e14` in the CSS file) |
| `neon-decay` (JSON only, no CSS yet) | VS Code Neon Decay `#42f4c8` | Yes when we ship the CSS |
| `void-circuit` (JSON only) | VS Code Void Circuit `#8b6aff` | Yes when we ship the CSS |
| **`plasma-green`** | **≠** VS Code **Plasma Drift** (`#e050a0` pink) | **No.** Dashboard-only industrial green. Name collision. Document it. |
| aurora-seo / emerald-finance / vitality-health | none | Profile-specific, authored in www-theme-kit |

Local favorites vs public seed:

| Surface | Palette | Public? |
|---|---|---|
| `fin.html` (household) | aurora-finance | No |
| `kat.html` | aurora-kat (canonical holographic aurora) | No |
| `ruben.html` / `agentgarbo.html` | plasma-green | No (files), yes (palette in seed) |
| dashboard finances profile | emerald-finance | Yes |
| `C:\Github\fin` | plasma-green inline | Yes |
| SEO profile | aurora-seo | Yes |
| Health profile | vitality-health | Yes |

### 5.3 Theme drift to fix

| Item | Problem | Fix |
|---|---|---|
| `dashboard/themes/plasma-green.css` text tokens | Aurora-tinted `--text: #f0e8ff` vs kit plasma text `#d7faef` | Align to kit green family |
| `dashboard/themes/midnight-blue.css` | `--primary: #6C8EFF` vs kit `#818cf8` | Snap to kit **or** document as intentional “original seed look” |
| Token prefixes | Seed CSS uses `--bg` / `--primary`; kit canonical is `--dash-*` | Dual-publish: keep short aliases, add `--dash-*` so profile HTML can migrate |
| Missing CSS for JSON palettes | void-circuit, neon-decay, synthwave, martian-games, ocean-breeze, forest-depths | Generate from dashboard-palettes (don’t hand-author 6 more one-offs) |
| `syn-themes` mirror | martian / sg-martian / mg-website hex drift vs kit | Recopy from `syna-palettes.json` |
| DASHBOARD-PALETTE-GUIDE “Current Dashboards” | Still lists fin.html as Plasma Green | Already superseded 2026-07-25 — update the table |
| No generate step | Hand-copied hex in three places | Add `www-theme-kit` script: derive shared ids from syna; emit `dashboard/themes/{id}.css` |

### 5.4 Consistency vs uniqueness (the design rule)

**Shared (consistency):**

- `dashboard-tokens.css` structure: surfaces, type scale, radii 8/12/16, collapse chevron `rotate(90deg)`, 0.15–0.2s, Outfit + JetBrains Mono
- Breakpoints only: **389.98 / 575.98 / 767.98 / 991.98** (`C:\mcp\.config\mcp-breakpoints.json`)
- Native `<details>` / `<summary>`
- Fictional example data, `_comment` on fields, `file://` safe

**Unique (per profile — keep these different):**

| Profile | Character | Do not |
|---|---|---|
| SEO | Midnight navy, electric blue, graph-heavy, client chrome | Make it emerald or “wellness calm” |
| Finances | Measured emerald/gold, “old money + cyberpunk” | Use household aurora-finance or plasma neon as the public default |
| Health | Soft teal/lavender, radial washes, wellness-app | Reuse SEO gauges as the whole look |
| Pets (later) | Warm dusk, amber + teal, caregiver-quiet | Clone vitality-health |

Plasma-green / aurora-borealis / midnight-blue stay **general alternates** in `themes/`, not the per-profile identity.

---

## 6. New public theme-kit starter (recommended, Phase 3)

**Do not** create a third *production* kit. We already split correctly:

| Kit | Privacy | Stack |
|---|---|---|
| `syna-theme-kit` | Internal / suite | React, skins, Theme Customizer, Dockview |
| `www-theme-kit` | Network-private | PHP/Bootstrap + standalone `--dash-*` |
| `syn-themes` | Public | VS Code / Cursor extension + palette mirror |

**Do** add a **public teaching repo** (name options: `brand-theme-kit`, `theme-kit-seed`, `make-a-theme-kit`).

It should ship:

- `PROTOCOL.md` template (author here → copy-on-update → never `@import` a kit path)
- `tokens/brand-tokens.css` starter (`--brand-*`, `--glass-*`, `--radius-*`)
- `palettes/example-palettes.json` schema (6-color + glow + recommendedSkin)
- `profiles/default.json` + `profiles/README.md` (“when to split a profile”)
- A tiny HTML previewer (public, unlike `www-theme-kit.html` which is gitignored/local)
- A `scripts/copy-to-project.mjs` stub
- README that says: *this is a kit for making your kit.* For Syna apps use syna-theme-kit; for JN/www dashboards the private www-theme-kit is the house SSOT; for editor themes see syn-themes; for drop-in dashboards see dashboard.

Draw examples from **public** surfaces only: `dashboard/themes/*.css`, `syn-themes` palette ids, published PROTOCOL ideas. Do not dump private www brand hex tables or household aurora-finance.

**When:** after dashboard scaffolder + palette generate-step work. A starter kit that documents a broken scaffolder helps no one.

---

## 7. Suggested work order

### Phase 0 — story / hygiene (small, do anytime)

- [ ] senior-pet-care: remove GoFundMe; link `https://jenninexus.com/blog/senior-cat-care`
- [ ] senior-pet-care: add LICENSE; dated-snapshot note on `example/`
- [ ] Commit dashboard `docs/PUBLIC-LOCAL-SPLIT.md` (fin vs finances vs fin-local)
- [ ] Cross-links: dashboard ↔ fin ↔ senior-pet-care READMEs

### Phase 1 — dashboard kit actually works

- [ ] Fix all three `profile.json` `render` + `theme` + `dataInjection`
- [ ] Fix `package.json` `main` / `npm run open`
- [ ] Reconcile example-data ↔ inline JSON (seo, finances)
- [ ] Rewrite health `profile.json` to match `health.html`
- [ ] Add `profiles/README.md`; fix profile-system / getting-started / finances-profile docs
- [ ] Banner images: ship or remove
- [ ] Verify `npm run build-dashboard -- --profile {seo,finances,health}` on a clean `my-dashboard/`

### Phase 2 — theme alignment (kits → public copy)

- [ ] Document plasma-green ≠ plasma-drift in DASHBOARD-PALETTE-GUIDE + dashboard README
- [ ] Align plasma-green / midnight-blue CSS to kit (or mark intentional drift)
- [ ] Add `--dash-*` aliases beside short tokens in public theme CSS
- [ ] Resync `syn-themes/palettes/all-palettes.json` from syna (martian family)
- [ ] Update `/theme` command: authoring SSOT is `syna-palettes.json`
- [ ] Add generate/validate script in www-theme-kit for shared palette ids
- [ ] Update palette guide “current dashboards” table (fin.html = aurora-finance)

### Phase 3 — sister repos catch up

- [ ] `fin`: LICENSE, honest README, `package.json`, consume `plasma-green` / `--dash-*` from dashboard
- [ ] `fin`: register as `profiles.fin-template` in www-theme-kit `dashboard.json`
- [ ] Health: labs + habits if we keep advertising them
- [ ] Design `pets` profile + `dusk-companion` palette (fictional pet)
- [ ] senior-pet-care `docs/DASHBOARD.md` + sample JSON

### Phase 4 — public theme-kit starter

- [ ] New repo `brand-theme-kit` (or chosen name) from §6
- [ ] Point dashboard / syn-themes READMEs at it as “make your own kit”

---

## 8. What we will not do

- Merge `fin` into `dashboard`, or replace dashboard finances with a symlink to `fin`.
- Publish `D:\Documents\Finances`, Kat/Ruben packages, or AgentGarbo.
- Make all three profiles look like plasma-green “for brand consistency.”
- Treat `syn-themes` as the design-system SSOT (it is the editor pack + mirror).
- Treat `syna-theme-kit/profiles/dashboard.json` as the OSS seed map.
- Stand up a third production theme kit that apps must vendor.
- Put a live GoFundMe in senior-pet-care.
- Invent a `senior-pet` theme by recoloring vitality-health 10%.

---

## 9. File map (quick)

| Concern | Path |
|---|---|
| This plan | `C:\Github\dashboard\Plans\_ACTIVE\cross-repo-updates-8-17.md` |
| Public/local split | `C:\Github\dashboard\docs\PUBLIC-LOCAL-SPLIT.md` |
| Scaffolder | `C:\Github\dashboard\scripts\build-dashboard.mjs` |
| Profile manifests | `C:\Github\dashboard\profiles\{seo,finances,health}\profile.json` |
| Public theme copies | `C:\Github\dashboard\themes\*.css` |
| Dashboard palette registry | `C:\Github\www-theme-kit\palettes\dashboard-palettes.json` |
| Dashboard profile map | `C:\Github\www-theme-kit\profiles\dashboard.json` |
| `--dash-*` tokens | `C:\Github\www-theme-kit\tokens\dashboard-tokens.css` |
| Palette guide | `C:\Github\www-theme-kit\docs\DASHBOARD-PALETTE-GUIDE.md` |
| Syna dashboard overlay | `C:\Github\syna-theme-kit\profiles\dashboard.json` |
| Accent authoring | `C:\Github\syna-theme-kit\palettes\syna-palettes.json` |
| VS Code themes | `C:\Github\syn-themes\themes\*.json` |
| Palette mirror | `C:\Github\syn-themes\palettes\all-palettes.json` |
| Finance workspace seed | `C:\Github\fin` |
| Household `/fin` | `D:\Documents\Finances` (LOCAL) |
| Pet tracker | `C:\Github\senior-pet-care` |
| Alice story (link this) | `https://jenninexus.com/blog/senior-cat-care` |
| Breakpoints | `C:\mcp\.config\mcp-breakpoints.json` |

---

## 10. One-paragraph summary

Keep three public repos with three jobs: **dashboard** is the generic profile kit (keep SEO, finances, health; add pets later), **fin** is the operational finance workspace seed (refresh it, consume dashboard tokens, do not merge), **senior-pet-care** is the printable tracker (drop GoFundMe, link the blog, optionally gain a `pets` profile). Author shared accents in **syna-theme-kit**, standalone dashboard chrome in **www-theme-kit**, editor themes in **syn-themes**, and copy into public `dashboard/themes/`. A future **brand-theme-kit** teaches other people to build a kit; it is not a fourth house SSOT. Local `D:\Documents\Finances` stays the private evolution and never goes to GitHub.
