// Runtime configuration & k6 options builder.
// Single source of truth: parses env vars once, exposes an immutable config,
// and derives k6 `options` (scenarios + thresholds) from it.

// Defaults to the TEST gatekeeper — never load-test production. Override with
// -e BASE_URL=... for stage / local (see .env.example for known hosts).
const DEFAULT_BASE_URL = 'https://test-gatekeeper.beed.world/api';
const ALL_SERVICES = ['experio', 'hub', 'library'];

// p95 latency budget (ms) per service — tune to your SLOs.
const P95_BUDGET_MS = { experio: 1500, hub: 1000, library: 1000 };

// Loose budget for the per-endpoint sub-metrics. These thresholds exist only to
// *materialize* a `name`-tagged sub-metric (so it surfaces in the terminal
// summary and the web dashboard's Summary tab) — not to gate the run.
const ENDPOINT_SUBMETRIC_BUDGET_MS = 60000;

/**
 * Split a comma-separated env value into trimmed, non-empty tokens.
 * @param {string|undefined} raw
 * @returns {string[]}
 */
function parseList(raw) {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Requested services restricted to known ones; falls back to all when empty/invalid.
 * @param {string|undefined} raw
 * @returns {string[]}
 */
function parseServices(raw) {
  const requested = parseList(raw).filter((s) => ALL_SERVICES.includes(s));
  return requested.length ? requested : ALL_SERVICES;
}

/**
 * Parse the process env into an immutable config.
 * @param {Record<string, string>} env  k6's `__ENV`.
 * @returns {import('../lib/types.js').Config}
 */
export function loadConfig(env) {
  const endpoints = parseList(env.ENDPOINTS);
  return Object.freeze({
    baseUrl: env.BASE_URL || DEFAULT_BASE_URL,
    sessionCookie: env.BEED_SID || '',
    peakVus: parseInt(env.VUS || '25', 10),
    holdDuration: env.DURATION || '1m',
    services: parseServices(env.SERVICES),
    endpoints: endpoints.length ? endpoints : null, // null = run every endpoint
    thinkTime: parseFloat(env.THINK_TIME || '1'),
  });
}

/**
 * Derive k6 `options` (scenarios + thresholds) from config.
 * @param {import('../lib/types.js').Config} config
 * @param {string[]} [endpointNames]  Endpoints that will actually run; each gets a
 *   per-endpoint p95 sub-metric so the `name` breakdown shows in summary/dashboard.
 * @returns {{ scenarios: Record<string, object>, thresholds: Record<string, string[]> }}
 */
export function buildOptions(config, endpointNames = []) {
  const stages = [
    { duration: '30s', target: config.peakVus }, // ramp up
    { duration: config.holdDuration, target: config.peakVus }, // steady
    { duration: '15s', target: 0 }, // ramp down
  ];

  const scenarios = {};
  const thresholds = { http_req_failed: ['rate<0.01'] }; // <1% errors overall

  for (const service of config.services) {
    scenarios[service] = {
      executor: 'ramping-vus',
      exec: service,
      startVUs: 0,
      stages,
      tags: { service },
    };
    thresholds[`http_req_duration{service:${service}}`] = [`p(95)<${P95_BUDGET_MS[service]}`];
  }

  for (const name of endpointNames) {
    thresholds[`http_req_duration{name:${name}}`] = [`p(95)<${ENDPOINT_SUBMETRIC_BUDGET_MS}`];
  }

  return { scenarios, thresholds };
}
