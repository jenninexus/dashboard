import { readFileSync, writeFileSync } from 'node:fs';

const jobs = [
  ['profiles/seo/seo.html', 'seo-data', 'profiles/seo/example-data.json'],
  ['profiles/finances/finances.html', 'fin-data', 'profiles/finances/example-data.json'],
  ['profiles/health/health.html', 'health-data', 'profiles/health/example-data.json'],
  ['profiles/pets/pets.html', 'pets-data', 'profiles/pets/example-data.json'],
];

for (const [htmlPath, id, out] of jobs) {
  const html = readFileSync(htmlPath, 'utf8');
  const re = new RegExp(`<script id="${id}"[^>]*>([\\s\\S]*?)</script>`);
  const m = html.match(re);
  if (!m) {
    console.error('MISSING', id);
    process.exit(1);
  }
  const data = JSON.parse(m[1]);
  writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
  console.log('wrote', out, 'keys', Object.keys(data).join(','));
}
