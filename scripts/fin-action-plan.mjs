#!/usr/bin/env node
import { syncActionPlan } from './lib/finance-tools.mjs';
import { parseArguments } from './lib/dashboard-cli.mjs';

const usage = `Usage: npm run fin:action-plan -- [--out my-dashboard] [--file ACTION-PLAN.md] [--init]

Copies the dashboard folder's ACTION-PLAN.md into data.json (actionPlan.markdown) and refreshes
dashboard.html. "## Heading" lines become checklist groups; "- [ ] task" lines become items.
--init creates ACTION-PLAN.md from the current data once; it never overwrites an existing file.`;

try {
  const args = parseArguments(process.argv.slice(2), ['out', 'file'], ['help', 'init']);
  if (args.help) console.log(usage);
  else {
    const result = syncActionPlan({ out: args.out, file: args.file, init: args.init });
    if (result.created) console.log(`Created ${result.path}. Edit it, then run this command again without --init.`);
    else console.log(result.changed ? `Synced ${result.path} into data.json and dashboard.html.` : 'Already up to date.');
  }
} catch (error) {
  console.error(`Action plan sync failed: ${error.message}`);
  process.exitCode = 1;
}
