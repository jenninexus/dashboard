# Finances profile

`profiles/finances` is the personal finance variant.

## What to reuse first

- `holdings` for cash visibility.
- `bills` for due status.
- `loans` for still-owed summaries.
- `income` for YTD rollups.

If you are adapting for your own money system, begin by replacing values in `data.json` before changing layout.

## For users choosing this profile

1. Build from this profile.
2. Edit your values in `my-dashboard/data.json`.
3. Keep `example-data.json` as your reference map.
4. Add your own labels only after dashboard renders correctly.

## Why finances has its own HTML

Finance data is not just SEO data with different labels. It needs cash coverage bars, bill status rows, loan foldouts, and income totals.

That is why this profile owns `profiles/finances/dashboard.html` instead of sharing the root SEO render.

## Example extension direction

- Add checklist-like action rows.
- Add optional archive/history records.
- Add CSV or sheet import behind a toggle.

## Privacy and ownership

- Keep `data.json` private in your fork if it contains real numbers.
- This profile runs fully without remote credentials.
- If you later add integrations, note required keys in docs and template files only.
