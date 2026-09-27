#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { startWizard } from './server.mjs';
import { parseArguments } from '../lib/dashboard-cli.mjs';

try {
  if (Number(process.versions.node.split('.')[0]) < 18) throw new Error('Dashboard requires Node.js 18 or newer. Install Node.js, then run Dashboard.cmd again.');
  const args = parseArguments(process.argv.slice(2), ['out', 'port', 'idle-minutes'], ['open', 'help']);
  if (args.help) console.log('Usage: npm run dashboard -- [--out my-dashboard] [--port 0] [--idle-minutes 20] [--open]');
  else {
    const wizard = await startWizard({ out: args.out, port: args.port === undefined ? 0 : Number(args.port), idleMs: args['idle-minutes'] === undefined ? undefined : Number(args['idle-minutes']) * 60000 });
    console.log(`Dashboard editor: ${wizard.url}`);
    console.log('Keep this window open. Use Stop in the editor or Ctrl+C to close it.');
    console.log('Data, generated HTML, exports and the rotating backup are unencrypted local files.');
    if (args.open) {
      const [command, commandArgs] = process.platform === 'win32'
        ? ['rundll32.exe', ['url.dll,FileProtocolHandler', wizard.url]]
        : process.platform === 'darwin' ? ['open', [wizard.url]] : ['xdg-open', [wizard.url]];
      const child = spawn(command, commandArgs, { shell: false, windowsHide: true, stdio: 'ignore' });
      child.on('error', () => console.error('Could not open a browser automatically. Open the editor URL above.'));
      child.unref();
    }
    process.once('SIGINT', () => { void wizard.stop(); });
    process.once('SIGTERM', () => { void wizard.stop(); });
    await wizard.closed;
    console.log('Dashboard editor stopped; local port released.');
  }
} catch (error) {
  console.error(`Dashboard could not start: ${error.message}`);
  process.exitCode = 1;
}
