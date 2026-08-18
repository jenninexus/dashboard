# Pink pets header + theme-designer + leftover kit/site work

Continue the 2026-08-17 cross-repo run. Pets HTML is approved; restyle dusk-companion from brown/amber to pink dusk, ship a real image header, register kits, start `theme-designer`, product-design note, JN site cross-links.

## Done when

- [x] `profiles/pets/pets.html` uses a real `<img>` banner (like seo/finances/health), not only the paw emoji
- [x] Pets tokens are pink/plum dusk (`#f472b6` family), not brown charcoal / amber `#f5b942`
- [x] Cat illustration lives under `docs/images/pets/` (webp + 1x1 avatar); source PNG on D: is copied, not deleted
- [x] `themes/dusk-companion.css` matches the HTML `:root`
- [x] README hero table has a pets screenshot at `docs/screenshots/hero/1920/pets-1920.png`
- [x] www-theme-kit registers `dusk-companion`, `pets`, and `fin-template`
- [x] syn-themes `palettes/all-palettes.json` martian / sg-martian / mg-website hexes match syna-theme-kit
- [x] `C:\Github\theme-designer` has README + `docs/ROADMAP.md` (and a minimal PROTOCOL/tokens seed)
- [x] `C:\Github\product-design\docs\THEME-DESIGNER.md` explains interchangeable use as a dashboard brand-kit
- [x] JN `senior-cat-care.php` links the pets dashboard; `/products` has a Dashboard card
- [x] `/theme` command no longer calls syn-themes `all-palettes.json` the authoring SSOT
- [ ] dashboard (and other owned repos) pushed; wrap handoff written

## Task checklist

- [x] Image copy + webp/1x1
- [x] Pink dusk restyle (css + html + docs)
- [x] Hero screenshot
- [x] www-theme-kit registry + palette guide table
- [x] syn-themes martian mirror
- [x] theme-designer seed
- [x] product-design card
- [x] JN blog + products
- [x] /theme skill SSOT fix
- [x] Verify scaffolder still injects pets
- [ ] Wrap + push owned repos

## Assumptions

- “Move” the cat PNG means **copy into the public seed**. Deleting `D:\AI\2024\Pink Cat\cats\Slide3.PNG` would destroy the art library. Flip if the human wanted the D: file gone.
- Dusk-companion **id stays**; only the hex character changes (pink dusk, not a new palette id).
- Sunset coral `#fb923c` is a secondary from the illustration, not brown chrome.
- www-theme-kit is on sibling topic branch `codex/social-notifier-release` with dirty `discord-bot.json`. Commit **explicit paths only**; do not stage discord-bot. Prefer landing registry on `main` if checkout is safe.
- syn-themes `all-palettes.json` already has uncommitted martian **skin** resync; completing martian **hex** drift in the same file is intended. Do not commit `.gitignore` / `.code-workspace`.
- JN live SSH deploy is parked unless a sanctioned site publish command exists; git push to `origin/jenni` is the authorized path.
- Creating public `jenninexus/theme-designer` is in scope (user named the repo).
- Do not copy household finance data. Do not put Alice’s real chart in the public pets seed.

## Evidence

- VERIFIED: other profiles already had `<img>` banners; pets had CSS-only + paw emoji. Pets now uses `docs/images/pets/pink-cats-16x9.webp`.
- VERIFIED: `rg '#f5b942|#0c0908'` in pets.html → no matches; primary is `#f472b6`.
- VERIFIED: source `D:\AI\2024\Pink Cat\cats\Slide3.PNG` still exists (copied, not deleted).
- VERIFIED: vid-scroll wrote `docs/screenshots/hero/1920/pets-1920.png` (592 KB) from `file:///C:/Github/dashboard/profiles/pets/pets.html`.
- VERIFIED: `node scripts/build-dashboard.mjs --profile pets --name "Scaffold Pink"` injects name + `#f472b6`.
- VERIFIED: JSON.parse of www-theme-kit dashboard.json + dashboard-palettes.json + syn-themes all-palettes.json.
- UNVERIFIED: live jenninexus.com until `/deploy jenni` git-pull succeeds.
- UNVERIFIED: headed visual QA of health labs/habits (code present; not re-opened in a headed browser this run).

## Deferred

- Live droplet deploy of JN (sanctioned `/deploy jenni` after git push).
- Scaffolder still leaves `../../docs/images/pets/` relative paths in `my-dashboard/` (same class of bug as missing agency banners).
- Generated `~/.codex/skills/theme/SKILL.md` is write-protected; source `~/.claude/commands/syn/theme.md` is corrected — rerun sync-command-skills.
- www-theme-kit sibling dirty `profiles/discord-bot.json` on `codex/social-notifier-release` — not staged.
- syn-themes `.gitignore` / `.code-workspace` dirty — not staged.
- Optional later from theme-designer ROADMAP: HTML previewer, copy-to-project.mjs, generate/validate script.
