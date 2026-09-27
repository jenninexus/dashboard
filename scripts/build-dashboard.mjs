#!/usr/bin/env node
/** Initial scaffolding only. Existing output is updated by update-dashboard.mjs. */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadProfile, scaffoldDashboard } from './lib/dashboard-core.mjs';
import { parseArguments } from './lib/dashboard-cli.mjs';

try {
  const args = parseArguments(process.argv.slice(2), ['profile', 'out', 'name', 'domain'], ['list', 'help']);
  if (args.help) {
    console.log('Usage: npm run build-dashboard -- --profile <id> [--name "Your Name"] [--domain example.com] [--out my-dashboard]');
  } else if (args.list) {
    for (const directory of readdirSync(join(ROOT, 'profiles'), { withFileTypes: true }).filter(item => item.isDirectory())) {
      const profile = loadProfile(directory.name);
      console.log(`${profile.id.padEnd(10)} ${profile.name} — ${profile.status}`);
    }
  } else {
    if (!args.profile) throw new Error('Missing --profile; use --list to see available profiles');
    const result = scaffoldDashboard({ profileId: args.profile, out: args.out, name: args.name, domain: args.domain });
    console.log(`Scaffolded ${result.profileId} dashboard: ${result.htmlPath}`);
    console.log(`Edit ${join(result.output, 'data.json')}, then run:`);
    console.log(`  npm run dashboard:update -- --out ${JSON.stringify(result.output)}`);
    console.log('Open dashboard.html in your browser after updating.');
    console.log('Data, generated HTML, exports and the rotating backup are unencrypted local files.');
  }
} catch (error) {
  console.error(`Dashboard scaffold failed: ${error.message}`);
  process.exitCode = 1;
}
