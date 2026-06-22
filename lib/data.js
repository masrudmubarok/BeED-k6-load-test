// Pure data helpers (no I/O — file loading happens in the composition root so
// `open()` path resolution stays unambiguous and these stay unit-testable).

const SEARCH_FALLBACK = 'a';

/**
 * Pick a uniformly random element, or `undefined` when the array is empty/absent.
 * @template T
 * @param {T[]} arr
 * @returns {T|undefined}
 */
export function pickFrom(arr) {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Random integer in the inclusive range [min, max]. Used to vary pagination so
 * the load exercises real OFFSET/LIMIT query plans rather than always page 1.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Build a query string from a params object, skipping null/undefined/'' values
 * and URL-encoding both keys and values. Returns '' or '?a=1&b=2'. Centralising
 * the encoding here keeps endpoint definitions declarative and double-encode-free.
 * @param {Record<string, string|number|boolean|undefined|null>} params
 * @returns {string}
 */
export function qs(params) {
  const parts = [];
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/**
 * Build a zero-arg picker that yields a random RAW search term. Encode at the
 * use site via `qs` (so terms with spaces/symbols stay correct). Falls back to a
 * single character if no terms are configured.
 * @param {string[]} terms
 * @returns {import('./types.js').TermPicker}
 */
export function makeTermPicker(terms) {
  return () => pickFrom(terms) || SEARCH_FALLBACK;
}
