# Finances profile

`profiles/finances` is a fictional, local-only snapshot renderer. It is not a bank connection,
payment authority, transaction ledger, creditor reconciliation, or substitute for current records.

## Derived values

- **Liquid holdings** = sum of `holdings.accounts[].amount`.
- **Monthly income** = active and variable `income[].monthlyEst` rows.
- **Bill-cycle total** = bills whose ISO due date starts with `profile.billCycle`.
- **Outstanding bills** = selected-cycle rows not recorded as paid. Autopay means scheduled, not paid.
- **Savings rate** = rounded `(income - profile.monthlyExpenses) / income × 100` when both values are
  known and income is positive.
- **Loan balance** = principal minus paid-to-date when `balanceBasis` says so; an explicit
  `stillOwed` must agree.
- **Net worth** is shown only when `profile.liabilitiesComplete` is true; otherwise it remains
  unknown rather than implying missing liabilities are zero.

Dates use `YYYY-MM-DD`. Due labels compare calendar dates without UTC conversion. Tests can set a
date-only `window.dashboardToday` before rendering; normal viewing uses local calendar components.

## Urgency features

All thresholds count whole calendar days from today (negative = past).

### Autopay escalation

Autopay rows in `bills[]` (`"status": "autopay"`) and `deadlines[]` (`"autopay": true`) carry a badge
that escalates as the date approaches:

| Days until the autopay date | Badge |
|---|---|
| more than 7 | calm (teal) |
| 7 or fewer | warning (amber) |
| 3 or fewer, including today | alert (rose, pulsing) |
| date has passed | *unconfirmed* (dashed amber) — a schedule is not proof of payment |

The pulse respects `prefers-reduced-motion`: with reduced motion the ≤3-day badge keeps a heavier
static outline instead of animating. The optional `autopayAccount` field names the card or account
nickname (never a full account number).

### Priority alerts

The Priority Alerts card shows your hand-written `alerts[]` first, then alerts generated from the data:

- **Bills** in the current cycle that are not `paid`: overdue (urgent), due within 3 days (urgent),
  autopay within 7 days (urgent at ≤3, otherwise warning), and autopay dates that passed (warning,
  "confirm it cleared"). Unpaid non-autopay bills 4–7 days out stay in the bills table only.
- **Deadlines**: overdue or within 3 days (urgent), within 7 days (warning), and any deadline with
  `"priority": true` regardless of distance (info when more than 7 days away).

Generated alerts are sorted urgent → warning → info, then by date, and are tagged **auto**. Keep
hand-written alerts for things the data cannot express (for example, a late client invoice).

### Deadlines

`deadlines[]` is optional. Each row has `id`, `label`, `date`, `category`
(`bills`, `taxes`, `income`, `loans`, `insurance`, `other`) and optionally `priority`, `autopay`,
`autopayAccount`, `amount` (or `null`) and `note`. The card sorts by urgency: most overdue first,
then soonest; `priority` wins ties; otherwise data order is kept.

### Payment history (append-only)

`history[]` is optional and is a log, not a ledger: `{ id, date, type, label, amount, source, note? }`
with `type` one of `payment`, `todo-done`, `deadline-cleared`, `deadline-passed` and `source` one of
`bills`, `deadlines`, `todos`, `action-plan`. The card lists it newest first with a payments total.

Append an entry (the date defaults to today) — this validates, writes `data.json`, and refreshes the
HTML in one locked step:

```bash
npm run fin:history -- --out my-dashboard --label "Rent — July" --amount 1400 --type payment --source bills
```

Entries are never edited or removed. `fin:history` refuses to append if `data.json` lost or changed an
entry the dashboard already shows; restore it from `dashboard.html.bak` or a backup export and append
a correcting entry instead. (The wizard and a hand edit of `data.json` can still change any field;
the rule is enforced by the append command, and by you.)

### ACTION-PLAN.md checklist

The Action Plan card combines `todos[]` buckets with a Markdown checklist stored in
`actionPlan.markdown`. `## Heading` (or `###`/`####`, with optional `1.` numbering) starts a group;
`- [ ] task` and `- [x] done task` lines become items. Item ids come from the text, so reordering
lines keeps their saved state.

Keep the plan as a file next to your data and sync it:

```bash
npm run fin:action-plan -- --out my-dashboard --init   # once: writes ACTION-PLAN.md from the data
npm run fin:action-plan -- --out my-dashboard          # after each edit of ACTION-PLAN.md
```

`--init` never overwrites an existing file. Checking an item or archiving it (↓) is stored in browser
storage; **show N archived** lists archived items with a restore button. When storage is blocked or
corrupt the checklist still renders from the Markdown defaults and works for the current visit.

### Older data files

`deadlines`, `history`, `actionPlan` and `bills[].autopayAccount` were added after the version 1
contract shipped. They are optional: a `data.json` without them still validates and renders, and the
wizard shows an **Add** button for the empty collections.

## Optional AI commands

`.claude/commands.example/` holds three example commands for this profile — `/fin-start` (session
summary), `/bills` (bill status by urgency) and `/ap-done` (mark done + append history). They are
templates: copy them into `.claude/commands/` in your own clone (that folder is gitignored). See the
README for the copy command.

## Edit safely

Use the local wizard's finance forms or edit `my-dashboard/data.json`, then run:

```bash
npm run dashboard:update -- --out my-dashboard --profile finances
```

Both paths use the same editor contract and derived-consistency validation. Preserve stable record
ids when editing. Leave nullable unknowns as `null` rather than inventing a number or date.

The JSON, generated HTML, exports, and rotating backup are unencrypted plaintext. Checklist/archive/
theme/collapse browser state is disposable and is not a payment record or JSON backup content.
