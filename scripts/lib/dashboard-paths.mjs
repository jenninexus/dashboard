import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';

export function isWithin(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
}

// Reject reparse points rather than permitting an alias to change its target between reads/writes.
export function rejectLinks(path) {
  const absolute = resolve(path);
  let cursor = parse(absolute).root;
  for (const part of absolute.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    try {
      if (lstatSync(cursor).isSymbolicLink()) throw new Error(`Unsafe symbolic link or junction: ${cursor}`);
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
  }
  return absolute;
}

export function assertOutputRoot(path, repoRoot, { mustExist = true } = {}) {
  const output = rejectLinks(path);
  const repo = realpathSync(repoRoot);
  let ancestor = output;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const canonical = resolve(realpathSync(ancestor), relative(ancestor, output));
  if (canonical === parse(canonical).root) throw new Error('Unsafe output: a filesystem root is not a dashboard folder');
  if (isWithin(repo, canonical)) {
    const rel = relative(repo, canonical);
    // The shipped ignore rule protects this exact folder. A custom in-repository name
    // could otherwise put household data in the public Git working tree.
    if (rel !== 'my-dashboard') {
      throw new Error('Unsafe output: repository paths are protected; use my-dashboard or choose a folder outside the repository');
    }
  }
  if (mustExist && !existsSync(output)) throw new Error(`Dashboard folder does not exist: ${output}`);
  if (existsSync(output) && !lstatSync(output).isDirectory()) throw new Error('Output must be a directory');
  return canonical;
}

export function outputFile(output, filename, { optional = false } = {}) {
  const path = resolve(output, filename);
  if (!isWithin(output, path) || dirname(path) !== output) throw new Error('Unsafe output filename');
  rejectLinks(path);
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.nlink !== 1 || !isWithin(output, realpathSync(path))) {
      throw new Error(`Unsafe output file (not a regular, singly linked local file): ${filename}`);
    }
  } catch (error) {
    if (optional && error.code === 'ENOENT') return path;
    if (error.code === 'ENOENT') throw new Error(`Missing ${filename}; use a freshly scaffolded dashboard (legacy migration is not automatic)`);
    throw error;
  }
  return path;
}

export function sourceFile(root, relativePath) {
  if (typeof relativePath !== 'string' || isAbsolute(relativePath) || relativePath.includes('\\')) {
    throw new Error('Profile source paths must be relative forward-slash paths');
  }
  const path = resolve(root, relativePath);
  if (!isWithin(root, path)) throw new Error('Profile source path escapes its source root');
  rejectLinks(path);
  const real = realpathSync(path);
  if (!isWithin(root, real) || !lstatSync(real).isFile()) throw new Error('Invalid profile source file');
  return real;
}
