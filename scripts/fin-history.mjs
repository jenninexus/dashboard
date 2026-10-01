#!/usr/bin/env node
import { appendHistory, localDate, HISTORY_TYPES, HISTORY_SOURCES } from './lib/finance-tools.mjs';
import { parseArguments } from './lib/dashboard-cli.mjs';

const usage = `Usage: npm run fin:history -- --label "Rent — July" [--type payment] [--source bills]
         [--amount 1400] [--date YYYY-MM-DD] [--note "..."] [--out my-dashboard]

Appends one entry to history[] in data.json (append-only) and refreshes dashboard.html.
Types: ${HISTORY_TYPES.join(', ')}. Sources: ${HISTORY_SOURCES.join(', ')}. Date defaults to today.`;

try {
  const args = parseArguments(process.argv.slice(2), ['out', 'date', 'type', 'label', 'amount', 'source', 'note']);
  if (args.help) console.log(usage);
  else {
    if (!args.label) throw new Error('--label is required\n' + usage);
    const amount = args.amount === undefined ? null : Number(args.amount.replace(/[$,]/g, ''));
    if (amount !== null && !Number.isFinite(amount)) throw new Error('--amount must be a number');
    const result = appendHistory({
      out: args.out, date: args.date ?? localDate(), type: args.type ?? 'payment', label: args.label,
      amount, source: args.source ?? 'bills', note: args.note,
    });
    console.log(`Appended ${result.entry.id}: ${result.entry.label}`);
    console.log(`Updated ${result.dataPath} and ${result.htmlPath} (previous HTML kept as dashboard.html.bak).`);
  }
} catch (error) {
  console.error(`History append failed: ${error.message}`);
  process.exitCode = 1;
}
