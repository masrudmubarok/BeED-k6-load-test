import { pickFrom } from './data.js';

// Generic endpoint runner.
// Iterates a declarative endpoint registry and, for each entry:
//   - optionally filters to an explicit endpoint allow-list (test a specific subset),
//   - resolves required id keys from the data pool,
//   - skips the endpoint if any required pool is empty (graceful degradation
//     with partial data),
//   - builds the path and issues an authenticated GET.
// The runner is closed for modification: adding endpoints needs no change here.

/**
 * Run every endpoint in the registry once (data-driven, graceful on missing ids).
 * @param {import('./types.js').HttpClient}  client
 * @param {import('./types.js').Endpoint[]}  endpoints
 * @param {import('./types.js').Pool}        pool
 * @param {import('./types.js').TermPicker}  term
 * @param {string[]|null} [only]  Endpoint-name allow-list; `null` (default) runs all.
 */
export function runEndpoints(client, endpoints, pool, term, only = null) {
  for (const endpoint of endpoints) {
    if (only && !only.includes(endpoint.name)) continue;

    const needs = endpoint.needs || [];
    const hasMissingData = needs.some((key) => !pool[key] || pool[key].length === 0);
    if (hasMissingData) continue;

    const pickId = (key) => pickFrom(pool[key]);
    client.get(endpoint.name, endpoint.path(pickId, term));
  }
}
