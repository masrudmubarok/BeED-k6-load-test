// Composition root.
// Wires config -> client -> data -> scenarios and exposes k6 entry points
// (`options`, the per-service exec functions, and `setup`). No business logic
// lives here; everything is delegated to focused modules.
import { SharedArray } from 'k6/data';

import { buildOptions, loadConfig } from './config/environment.js';
import { makeTermPicker } from './lib/data.js';
import { createClient } from './lib/http-client.js';
import { makeScenario } from './lib/scenario.js';
import { experioEndpoints } from './endpoints/experio.endpoints.js';
import { hubEndpoints } from './endpoints/hub.endpoints.js';
import { libraryEndpoints } from './endpoints/library.endpoints.js';

const config = loadConfig(__ENV);

// Loaded once, shared read-only across all VUs. `open()` is resolved relative to
// this file (the project root), which is why file I/O lives in the root.
const data = new SharedArray('ids', () => [JSON.parse(open('./data/ids.json'))])[0];

const client = createClient(config);
const term = makeTermPicker(data.searchTerms);

// Single map of service -> (endpoint registry, id pool), used both to wire the
// exec functions and to enumerate which endpoints will actually run.
const services = {
  experio: { endpoints: experioEndpoints, pool: data.experio },
  hub: { endpoints: hubEndpoints, pool: data.hub },
  library: { endpoints: libraryEndpoints, pool: data.library },
};

// An endpoint fires only if it's in the selected services, passes the ENDPOINTS
// allow-list, and all its required id pools are non-empty (mirrors the runner's
// skip rule). Only these get a per-endpoint p95 sub-metric — no "no data" rows.
const willRun = (endpoint, pool) =>
  (!config.endpoints || config.endpoints.includes(endpoint.name)) &&
  (endpoint.needs || []).every((key) => pool[key] && pool[key].length > 0);

const activeEndpointNames = config.services.flatMap((name) => {
  const svc = services[name];
  return svc ? svc.endpoints.filter((e) => willRun(e, svc.pool)).map((e) => e.name) : [];
});

export const options = buildOptions(config, activeEndpointNames);

// Per-scenario knobs shared by every service (endpoint allow-list + think-time).
const scenarioOpts = { only: config.endpoints, thinkTime: config.thinkTime };

// Exec functions referenced by the scenarios in `options`.
export const experio = makeScenario(client, services.experio.endpoints, services.experio.pool, term, scenarioOpts);
export const hub = makeScenario(client, services.hub.endpoints, services.hub.pool, term, scenarioOpts);
export const library = makeScenario(client, services.library.endpoints, services.library.pool, term, scenarioOpts);

export function setup() {
  client.assertSession();
  console.log(`Auth OK. Services: ${config.services.join(', ')} @ ${config.peakVus} VUs each.`);
}
