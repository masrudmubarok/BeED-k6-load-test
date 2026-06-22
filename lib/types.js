// Central JSDoc type definitions — no runtime code.
// Other modules reference these via `import('./types.js').<Type>` in their JSDoc
// comments, so the shapes live in exactly one place and editors get
// autocompletion / type-checking without introducing a TypeScript build step.

/**
 * Immutable runtime configuration, parsed once from `__ENV` in the composition root.
 * @typedef {Object} Config
 * @property {string}        baseUrl       Gatekeeper base URL (e.g. http://localhost:1010/api).
 * @property {string}        sessionCookie `beed_sid` session cookie value.
 * @property {number}        peakVus       Peak virtual users per service.
 * @property {string}        holdDuration  Steady-state hold as a k6 duration (e.g. "1m").
 * @property {string[]}      services      Service scenarios to run (subset of experio/hub/library).
 * @property {string[]|null} endpoints     Endpoint-name allow-list, or `null` to run all.
 * @property {number}        thinkTime     Seconds a VU sleeps between iterations.
 */

/**
 * Id pools for one service, keyed by id name (e.g. `{ hubId: [1, 2], roomId: [9] }`).
 * @typedef {Record<string, Array<string|number>>} Pool
 */

/**
 * Picks a random id for the given pool key, or `undefined` if the pool is empty.
 * @callback PickId
 * @param {string} key
 * @returns {string|number|undefined}
 */

/**
 * Yields a raw (unencoded) random search term — encode at the use site via `qs`.
 * @callback TermPicker
 * @returns {string}
 */

/**
 * A declarative, data-driven endpoint definition.
 * @typedef {Object} Endpoint
 * @property {string}   name    Stable metric tag used for per-endpoint aggregation.
 * @property {string[]} [needs] Id keys that must exist in the pool, else the endpoint is skipped.
 * @property {(pick: PickId, term: TermPicker) => string} path Builds the request path.
 */

/**
 * The authenticated HTTP client surface scenarios depend on (DIP — never raw transport).
 * @typedef {Object} HttpClient
 * @property {(name: string, path: string) => unknown} get          Issue a tagged, checked GET.
 * @property {() => void}                              assertSession Fail fast if the cookie is missing/rejected.
 */

export {}; // marks this file as an ES module (types are import-only, never executed)
