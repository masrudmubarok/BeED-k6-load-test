import { check } from 'k6';

// Shared response assertion. Tags the check with the endpoint name so failures
// are attributable per endpoint in the summary.

/**
 * Assert a 2xx response, tagged by endpoint name.
 * @param {import('k6/http').Response} res
 * @param {string} name
 * @returns {boolean} whether the check passed.
 */
export function checkOk(res, name) {
  return check(res, {
    [`${name} -> 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
}
