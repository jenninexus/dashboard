# Land Phase 0–3 of the 2026-08-17 cross-repo dashboard plan

Apply the plan in `Plans/_ACTIVE/cross-repo-updates-8-17.md` to `dashboard`, `fin`, and `senior-pet-care` only. Do not edit the jenninexus website, www-theme-kit, syna-theme-kit, or syn-themes.

## Done when

- [x] `C:\Github\senior-pet-care\README.md` has no GoFundMe URL and links `https://jenninexus.com/blog/senior-cat-care`
- [x] `C:\Github\senior-pet-care\LICENSE` exists (MIT)
- [x] senior-pet-care example is labeled as a dated May 2026 snapshot
- [x] `C:\Github\fin\LICENSE` exists (MIT)
- [x] `C:\Github\fin\package.json` has `npm run start` wrapping `startup-session.ps1`
- [x] fin README file tree matches files that exist; missing Sheets script is not promised as shipped
- [x] dashboard `profiles/{seo,finances,health}/profile.json` `render` paths exist on disk
- [x] scaffolder writes `dashboard.html` for seo/finances/health/pets (`_scratch/*`)
- [x] health `profile.json` no longer says STUB
- [x] dashboard README cross-links `fin` and `senior-pet-care`
- [x] wrap + reflect landed; next-agent handoff emitted

## Task checklist

- [x] senior-pet-care hygiene + blog swap + DASHBOARD.md
- [x] fin LICENSE, package.json, honest README, three-surface split, theme comment
- [x] dashboard manifests, scaffolder, package.json, docs, theme token notes
- [x] reconcile example-data with inline HTML schemas
- [x] pets profile (4th) with fictional data
- [x] verify scaffolder for all ready profiles
- [x] reflect + wrap

## Assumptions

- Pets as a 4th profile is in scope (plan preferred this over extracting finances; user said do as much of the plan as possible).
- Theme-kit repos and the JN website are out of scope (user named three repos).
- midnight-blue.css keeps `#6C8EFF` as the documented original seed look (not snapped to kit `#818cf8`).
- plasma-green.css text tokens align to the green family already used in `fin.html` (`#d7faef`).
- Pushing `master` on these three jenninexus repos is authorized by the requested `/wrap`.
- Do not invent a `brand-theme-kit` repo this run (Phase 4; new public repo).
- Do not copy anything from `D:\Documents\Finances`.

## Evidence

- VERIFIED: `rg gofund` in senior-pet-care → no matches; README links jenninexus.com/blog/senior-cat-care
- VERIFIED: `node scripts/build-dashboard.mjs --profile seo --name "Scaffold Test" --out _scratch/seo --force` injects `profile.name = Scaffold Test` into `dashboard.html`
- VERIFIED: same scaffolder exits 0 for finances, health, pets
- VERIFIED: `JSON.parse` of all four example-data.json files (via extract script)
- UNVERIFIED: visual render of pets.html / health labs cards in a headed browser (no LIVPHI QA this run)
- UNVERIFIED: `npm run start` on fin (did not execute pwsh startup against example workspace)

## Deferred

- www-theme-kit `dashboard.json` / `dashboard-palettes.json` dusk-companion + pets + fin-template (user scoped this run to three repos)
- syn-themes martian mirror resync
- `/theme` skill SSOT correction
- brand-theme-kit public starter (Phase 4)
- pets hero screenshot in dashboard README gallery
- JN website blog cross-link (user forbade website edits)

