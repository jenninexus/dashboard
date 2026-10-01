# /fin-start — Finance session start

Example command for the dashboard **finances** profile. Copy it to `.claude/commands/` in your own
copy of the repository (see README → "Optional AI commands"). It works on your local
`my-dashboard/` folder, which is gitignored.

## Steps

1. Confirm `my-dashboard/.dashboard-meta.json` exists and its `profileId` is `finances`. If not, stop
   and suggest `npm run build-dashboard -- --profile finances`.
2. If `my-dashboard/ACTION-PLAN.md` exists, run `npm run fin:action-plan -- --out my-dashboard` so the
   checklist matches the file. Otherwise run `npm run dashboard:update -- --out my-dashboard`.
3. Read `my-dashboard/data.json` and report, using today's local calendar date:
   - **Overdue or due within 3 days:** `bills[]` in `profile.billCycle` not marked `paid`, and
     `deadlines[]` whose `date` has passed or is ≤ 3 days away.
   - **Autopay within 7 days:** autopay bills or deadlines; mark ≤ 3 days as urgent, and a passed
     autopay date as *unconfirmed* (a schedule is not proof of payment).
   - **Deadlines within 30 days**, sorted most overdue first, then soonest; `priority: true` first on ties.
   - **Checklist:** pending item count from `todos[]` and `actionPlan.markdown` (`- [ ]` lines).
4. Finish with the three most urgent actions and the command to open the dashboard
   (`my-dashboard/dashboard.html`).

## Rules

- Read-only except for the refresh command in step 2. Never invent amounts or dates; say "unknown".
- Never move money, log in to a bank, or contact a creditor.
