/** Bounded JSON parsing, with duplicate-key detection before information is lost. */
export const LIMITS = Object.freeze({ bytes: 2 * 1024 * 1024, depth: 48, collection: 10000, string: 65536 });
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);

export function parseStrictJson(source, label = 'JSON', limits = LIMITS) {
  if (typeof source !== 'string' || Buffer.byteLength(source, 'utf8') > limits.bytes) {
    throw new Error(`${label}: input exceeds ${limits.bytes} bytes or is not text`);
  }
  let pos = 0;
  const fail = message => { throw new Error(`${label}: ${message} at character ${pos}`); };
  const whitespace = () => { while (/[\x20\t\r\n]/.test(source[pos] || '\0')) pos++; };
  function string() {
    const start = pos++;
    while (pos < source.length) {
      const char = source[pos++];
      if (char === '\\') { pos++; continue; }
      if (char === '"') {
        let result;
        try { result = JSON.parse(source.slice(start, pos)); } catch { fail('invalid string'); }
        if (result.length > limits.string) fail(`string exceeds ${limits.string} characters`);
        return result;
      }
    }
    fail('unterminated string');
  }
  function value(depth) {
    if (depth > limits.depth) fail(`nesting exceeds ${limits.depth}`);
    whitespace();
    const char = source[pos];
    if (char === '"') return string();
    if (char === '{' || char === '[') {
      const object = char === '{';
      const result = object ? {} : [];
      const keys = new Set();
      const end = object ? '}' : ']';
      pos++;
      whitespace();
      if (source[pos] === end) { pos++; return result; }
      let count = 0;
      while (true) {
        if (++count > limits.collection) fail(`collection exceeds ${limits.collection} entries`);
        whitespace();
        let key;
        if (object) {
          if (source[pos] !== '"') fail('expected quoted object key');
          key = string();
          if (forbiddenKeys.has(key)) fail(`dangerous key "${key}"`);
          if (keys.has(key)) fail(`duplicate key "${key}"`);
          keys.add(key);
          whitespace();
          if (source[pos++] !== ':') fail('expected colon');
        }
        const child = value(depth + 1);
        if (object) result[key] = child;
        else result.push(child);
        whitespace();
        if (source[pos] === end) { pos++; return result; }
        if (source[pos++] !== ',') fail(`expected comma or ${end}`);
      }
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(pos));
    if (!token) fail('expected JSON value (comments and trailing commas are not supported)');
    pos += token[0].length;
    const result = JSON.parse(token[0]);
    if (typeof result === 'number' && (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER)) {
      fail('number is outside the finite safe numeric range');
    }
    return result;
  }
  const result = value(0);
  whitespace();
  if (pos !== source.length) fail('unexpected trailing content');
  return result;
}

/** JSON remains parseable while no string can terminate a script element. */
export function serializeJson(value) {
  return JSON.stringify(value, null, 2).replace(/[<>&\u2028\u2029]/g, char => ({
    '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029',
  })[char]);
}
