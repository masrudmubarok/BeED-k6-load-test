import http from 'k6/http';

import { checkOk } from './checks.js';

// Authenticated HTTP client.
// Encapsulates the session-cookie header, URL composition and per-endpoint
// tagging so scenarios never deal with auth or transport concerns (SRP).

/**
 * Create an authenticated HTTP client bound to the session cookie.
 * @param {import('./types.js').Config} config
 * @returns {import('./types.js').HttpClient}
 */
export function createClient(config) {
  const headers = { Cookie: `beed_sid=${config.sessionCookie}` };

  function get(name, path) {
    const res = http.get(`${config.baseUrl}${path}`, { headers, tags: { name } });
    checkOk(res, name);
    return res;
  }

  // Pre-flight guard: fail fast (in setup) if the cookie is missing or rejected,
  // instead of hammering the system with 401s.
  function assertSession() {
    if (!config.sessionCookie) {
      throw new Error('BEED_SID is empty. Pass -e BEED_SID="<beed_sid cookie value>".');
    }
    const res = http.get(`${config.baseUrl}/auth/session`, { headers });
    if (res.status !== 200) {
      throw new Error(
        `Session check failed (status ${res.status}). Cookie expired, or SECURE/SAME_SITE mismatch on localhost.`,
      );
    }
  }

  return { get, assertSession };
}
