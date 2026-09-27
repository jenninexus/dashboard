#!/usr/bin/env node
import { updateDashboard } from './lib/dashboard-core.mjs';
import { parseArguments } from './lib/dashboard-cli.mjs';

try {
  const args = parseArguments(process.argv.slice(2), ['out', 'profile']);
  if (args.help) console.log('Usage: npm run dashboard:update -- [--out my-dashboard] [--profile <expected-id>]');
  else {
    const result = updateDashboard({ out: args.out, profileId: args.profile });
    console.log(`${result.changed ? 'Updated' : 'Already up to date'}: ${result.htmlPath}`);
    if (result.changed) console.log('Previous HTML saved as dashboard.html.bak. data.json was not modified.');
  }
} catch (error) {
  console.error(`Dashboard update failed: ${error.message}`);
  process.exitCode = 1;
}
