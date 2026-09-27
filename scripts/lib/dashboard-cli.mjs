export function parseArguments(argv, values, flags = ['help']) {
  const result = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2);
    if (Object.hasOwn(result, key)) throw new Error(`Repeated option: ${arg}`);
    if (flags.includes(key)) result[key] = true;
    else if (values.includes(key)) {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      result[key] = value;
    } else throw new Error(`Unknown option: ${arg}${key === 'force' ? '; scaffolding never overwrites existing output. Use dashboard:update' : ''}`);
  }
  return result;
}
