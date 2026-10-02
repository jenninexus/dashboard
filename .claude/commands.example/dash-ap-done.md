---
description: Dashboard template example - mark an item done and append history in the finances profile's example data (my-dashboard/ built from profiles/finances/example-data.json). Not for any private finance workspace.
---

# /dash-ap-done — Example: mark an item done and log it

Example command for the dashboard **finances** profile. Copy it to `.claude/commands/` in your own
copy of the repository.

> **Scope:** this is an example command from the public `dashboard` template. It operates ONLY on
> this template's example finance data — `profiles/finances/example-data.json`, or your own copy of it
> built into the gitignored `my-dashboard/` folder. It is unrelated to any private or personal finance
> workspace, and must never be pointed at one. The `dash-` prefix keeps it from colliding with
> commands of the same purpose elsewhere.

## Usage

```
/dash-ap-done paid rent 1400
/dash-ap-done renewed vehicle registration
/dash-ap-done set up autopay for the gym
```

## Steps

1. Find the best match, in this order, and confirm it with the user if more than one fits:
   - a `- [ ]` line in `my-dashboard/ACTION-PLAN.md` → change it to `- [x]`;
   - a `bills[]` row in the current cycle → set `"status": "paid"`;
   - a `deadlines[]` row → remove it from `deadlines[]` (the history entry below keeps the record).
2. Append exactly one history entry. Never edit or delete existing `history[]` entries:

   ```bash
   npm run fin:history -- --out my-dashboard --type payment --source bills \
     --label "Rent — June" --amount 1400 --note "Paid from checking"
   ```

   Types: `payment`, `todo-done`, `deadline-cleared`, `deadline-passed`. Sources: `bills`,
   `deadlines`, `todos`, `action-plan`. The date defaults to today; pass `--date YYYY-MM-DD` otherwise.
3. If ACTION-PLAN.md changed, run `npm run fin:action-plan -- --out my-dashboard`; if only
   data.json changed, `fin:history` already refreshed `dashboard.html`.
4. Report what was marked done, the history entry id, and anything left due this week.

## Rules

- Only edit files under `my-dashboard/` in this repository; never write to any other finance data.
- History is append-only. To correct an entry, append a new one explaining the correction.
- Record a payment only when the user says it happened; autopay being scheduled is not payment.
