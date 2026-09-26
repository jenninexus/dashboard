import { execFileSync } from 'node:child_process';

const ignoredSamples = [
  '.env.local',
  '.env.production',
  'my-dashboard/data.json',
  '_private/app.ts',
  '.private/notes.md',
  'paid-app/main.js',
  'product-app-private/index.js',
  'coverage/lcov.info',
  'test-results/report.json',
  'playwright-report/index.html',
  '.nyc_output/out.json',
];

const publicSamples = [
  '.env.example',
  '.env.production.example',
  'profiles/finances/example-data.json',
];

const privateTrackedPath = /(^|\/)(_private|\.private|paid-app|product-app-private|my-dashboard|coverage|test-results|playwright-report|\.nyc_output)(\/|$)/;

function isIgnored(path) {
  try {
    execFileSync('git', ['check-ignore', '--no-index', '--quiet', '--', path], {
      cwd: process.cwd(),
      stdio: 'ignore',
    });
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

const failures = [];

for (const path of ignoredSamples) {
  if (!isIgnored(path)) failures.push(`expected ignored: ${path}`);
}

for (const path of publicSamples) {
  if (isIgnored(path)) failures.push(`expected public/trackable: ${path}`);
}

const trackedPaths = execFileSync('git', ['ls-files', '-z'], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean)
  .map((path) => path.replaceAll('\\', '/'));

for (const path of trackedPaths) {
  if (privateTrackedPath.test(path)) failures.push(`private/generated path is tracked: ${path}`);
}

if (failures.length > 0) {
  console.error('Public-boundary check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Public-boundary check passed: ${ignoredSamples.length} private/generated samples ignored, ` +
      `${publicSamples.length} public samples trackable, ${trackedPaths.length} tracked paths inspected.`,
  );
}
