# /bills — Bill status check

Example command for the dashboard **finances** profile. Copy it to `.claude/commands/` in your own
copy of the repository. Read-only: it reports, it does not edit.

## What to report

Read `my-dashboard/data.json`. For each `bills[]` row whose `due` starts with `profile.billCycle`,
show a table sorted by urgency (overdue first, then soonest due):

| Column | Source |
|---|---|
| Bill | `name` |
| Due | `due` and whole calendar days from today (negative = overdue) |
| Amount | `amount` |
| Status | `paid` · `due` · `overdue` · `autopay` (with `autopayAccount` when present) |

## Urgency levels (match the dashboard)

- **Urgent:** overdue and not paid, due within 3 days, or autopay within 3 days.
- **Warning:** autopay within 7 days, or an autopay date that has passed but is not recorded as
  paid in `history[]` ("unconfirmed").
- **Calm:** everything else, including autopay more than 7 days out.

End with the cycle total, the amount not yet recorded as paid, and any `deadlines[]` in the bills
category within 14 days.
