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

## Edit safely

Use the local wizard's finance forms or edit `my-dashboard/data.json`, then run:

```bash
npm run dashboard:update -- --out my-dashboard --profile finances
```

Both paths use the same editor contract and derived-consistency validation. Preserve stable record
ids when editing. Leave nullable unknowns as `null` rather than inventing a number or date.

The JSON, generated HTML, exports, and rotating backup are unencrypted plaintext. Checklist/theme/
collapse browser state is disposable and is not a payment record or JSON backup content.

For an operational finance workspace seed with a different scope, see
[jenninexus/fin](https://github.com/jenninexus/fin).
