---
description: Dashboard template example - read-only bill status for the finances profile's example data (my-dashboard/data.json from profiles/finances/example-data.json). Not for any private finance workspace.
---

# /dash-bills — Example bill status check

Example command for the dashboard **finances** profile. Copy it to `.claude/commands/` in your own
copy of the repository. Read-only: it reports, it does not edit.

> **Scope:** this is an example command from the public `dashboard` template. It operates ONLY on
> this template's example finance data — `profiles/finances/example-data.json`, or your own copy of it
> built into the gitignored `my-dashboard/` folder. It is unrelated to any private or personal finance
> workspace, and must never be pointed at one. The `dash-` prefix keeps it from colliding with
> commands of the same purpose elsewhere.

## What to report

Read `my-dashboard/data.json` in this repository (never finance data from anywhere else). For
each `bills[]` row whose `due` starts with `profile.billCycle`, show a table sorted by urgency
(overdue first, then soonest due):

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
