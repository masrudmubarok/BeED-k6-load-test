import { sleep } from 'k6';

import { runEndpoints } from './runner.js';

// Builds a k6 VU iteration function (an "exec") for one service: run all of its
// endpoints once, then think-time. Keeps the composition root declarative.

/**
 * @param {import('./types.js').HttpClient} client
 * @param {import('./types.js').Endpoint[]} endpoints
 * @param {import('./types.js').Pool}       pool
 * @param {import('./types.js').TermPicker} term
 * @param {{ only?: string[]|null, thinkTime?: number }} [opts]
 *   `only`: restrict to specific endpoint names. `thinkTime`: VU sleep (seconds).
 * @returns {() => void} k6 exec function.
 */
export function makeScenario(client, endpoints, pool, term, opts = {}) {
  const { only = null, thinkTime = 1 } = opts;
  return function scenario() {
    runEndpoints(client, endpoints, pool, term, only);
    sleep(thinkTime);
  };
}
