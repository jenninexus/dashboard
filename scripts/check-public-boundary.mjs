import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ignoredSamples = [
  '.env.local',
  '.env.production',
  'my-dashboard/data.json',
  'Plans/_active/session.md',
  'dev-chat.md',
  'dev-log.yaml',
  '.codex/skills/build-dashboard/SKILL.md',
  '.claude/commands/build-dashboard.md',
  '.claude/commands/dash-fin-start.md',
  '.claude/settings.local.json',
  '_scratch/output/dashboard.html',
  'storage/screenshots/seo.webp',
  'dashboard.code-workspace',
  '_private/app.ts',
  '.private/notes.md',
  'paid-app/main.js',
  'product-app-private/index.js',
  'coverage/lcov.info',
  'test-results/report.json',
  'playwright-report/index.html',
  '.nyc_output/out.json',
  'docs/screenshots/390/seo-390.webp',
];

const publicSamples = [
  '.env.example',
  '.env.production.example',
  'profiles/finances/example-data.json',
  'docs/screenshots/hero/1920/seo-1920.png',
  'docs/images/pets/pink-cats-16x9.webp',
  '.claude/commands.example/dash-fin-start.md.example',
];

const privateTrackedPath =
  /(^|\/)(plans|_private|\.private|paid-app|product-app-private|my-dashboard|_scratch|storage|\.codex|\.claude|coverage|test-results|playwright-report|\.nyc_output)(\/|$)/i;

const privateTrackedFile = /(^|\/)(dev-chat\.md|dev-log\.ya?ml|.*\.code-workspace)$/i;
const nonHeroScreenshot = /^docs\/screenshots\/(?!hero\/)/i;
const secretOrLocalConfig = /(^|\/)\.env(?!\.example$|\.[^/]+\.example$)/i;
const textFile = /\.(?:c?js|mjs|json|md|html|css|ps1|txt|ya?ml|example)$/i;
const machineSpecificAbsolutePath = /(?:^|[\s"'`(])(?:[a-z]:[\\/]|file:\/\/\/[a-z]:)/im;

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

// Example AI commands are public templates: `*.md.example` only, directly inside .claude/commands.example/.
// The .example suffix keeps tools that load or scan `*.md` commands from ever picking them up.
const publicCommandExample = /^\.claude\/commands\.example\/[a-z0-9-]+\.md\.example$/;

for (const path of trackedPaths) {
  if (privateTrackedPath.test(path) && !publicCommandExample.test(path)) failures.push(`private/generated path is tracked: ${path}`);
  if (privateTrackedFile.test(path)) failures.push(`local agent/workspace file is tracked: ${path}`);
  if (nonHeroScreenshot.test(path)) failures.push(`uncurated QA screenshot is tracked: ${path}`);
  if (secretOrLocalConfig.test(path)) failures.push(`secret/local env file is tracked: ${path}`);
  if (textFile.test(path)) {
    const contents = readFileSync(path, 'utf8');
    if (machineSpecificAbsolutePath.test(contents)) {
      failures.push(`machine-specific absolute path appears in public text: ${path}`);
    }
  }
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
