# BeED Load Tests (k6)

Performance/load suite for the BeED APIs, exercised **through the Gatekeeper**
(`http://localhost:1010/api`) with the `beed_sid` session cookie. It covers the
read-only GET endpoints of **Experio Builder**, **Hub**, and **Unified Library**.

This is a standalone, cross-service suite by design: it tests the full request
path (Gatekeeper auth → proxy → downstream service) and belongs to no single
service repo.

## Architecture

```
beed-load-tests/
├── main.js                     # composition root: wires everything, exports k6 entry points
├── config/
│   └── environment.js          # env parsing + k6 options (scenarios + thresholds)
├── lib/
│   ├── http-client.js          # authenticated client (cookie, tagging, session guard)
│   ├── runner.js               # generic endpoint iterator (data-driven, skips on missing ids)
│   ├── scenario.js             # builds a per-service VU iteration
│   ├── data.js                 # pure helpers (random pick / term)
│   ├── checks.js               # shared 2xx assertion
│   └── types.js                # central JSDoc typedefs (Config, Endpoint, Pool, …) — no runtime code
├── endpoints/                  # declarative endpoint registries (the only file you edit to add URLs)
│   ├── experio.endpoints.js
│   ├── hub.endpoints.js
│   └── library.endpoints.js
└── data/
    └── ids.json                # id pools per service
```

**Design principles**
- **SRP** — each module has one reason to change (transport, data, config, scenario).
- **OCP** — endpoints are declarative data; add a URL = add a registry entry, the runner is untouched.
- **DIP** — scenarios depend on the abstract `client` + endpoint definitions, never on raw URLs/transport.
- **Composition root** — `main.js` is the only place that knows how the pieces fit together.
- **Graceful degradation** — endpoints whose required ids are absent in `data/ids.json` are skipped.

## Target environments
Tests run against the **test** gatekeeper by default — **never load-test production.**
Switch hosts with `-e BASE_URL=...` (sourced from the BeED UI environment files):

| Env | `BASE_URL` |
|---|---|
| test (default) | `https://test-gatekeeper.beed.world/api` |
| stage | `https://stage-gatekeeper.beed.world/api` |
| local | `http://localhost:1010/api` |

## Prerequisites
1. Install k6 — `winget install k6` (or see https://k6.io/docs/get-started/installation/).
2. Network access to the target gatekeeper (for `local`, run Gatekeeper + downstreams).

## Setup
### 1. Get the session cookie (once)
The cookie is **origin-specific** — grab it from the same host as your `BASE_URL`.
- Browser → `<BASE_URL host>/auth/login` (e.g. `https://test-gatekeeper.beed.world/api/auth/login`) → sign in.
- DevTools → Application → Cookies → that host → copy the **`beed_sid`** value.
- Local only: the cookie may need `SESSION_COOKIE_SECURE=false` and
  `SESSION_COOKIE_SAME_SITE=lax` in the Gatekeeper `.env`.

### 2. Fill `data/ids.json`
Put valid ids from the target DB into the arrays. Start with a few — empty arrays
just skip the endpoints that need them.

## Run
```bash
# all services, default load (25 VUs/service, 1m hold)
k6 run -e BEED_SID="<cookie value>" main.js

# smoke (validate cookie + endpoints before real load)
k6 run -e BEED_SID="<cookie value>" -e VUS=1 -e DURATION=10s main.js

# subset + custom load
k6 run -e BEED_SID="<cookie value>" -e SERVICES=library,hub -e VUS=50 -e DURATION=2m main.js

# target specific endpoints only (e.g. re-test the ones in OPTIMIZATION.md)
k6 run -e BEED_SID="<cookie value>" -e ENDPOINTS=lib:search,lib:search.suggest main.js

# machine-readable output
k6 run -e BEED_SID="<cookie value>" --out json=result.json main.js
```

(npm shortcuts exist in `package.json`, e.g. `npm run smoke` — still append `-e BEED_SID=...`.)

## Dashboard / reporting
No Grafana or InfluxDB required — k6 ships a built-in web dashboard.

```bash
# live dashboard at http://localhost:5665 while the test runs
npm run dashboard            # or: node run.js run --dashboard main.js

# self-contained HTML report written at the end (shareable, no server needed)
npm run report:html          # or: node run.js run --report=html-report.html main.js

# raw JSON time-series (feed your own tooling)
npm run report               # -> result.json
```

`--dashboard` / `--report[=file.html]` are launcher flags handled by `run.js`
(they set `K6_WEB_DASHBOARD*` for you); everything else passes through to k6.
Remember to append `-e BEED_SID=...` (or put it in `.env`).

Per-endpoint breakdown also shows in the dashboard's **Summary** tab via the
auto-generated `http_req_duration{name:...}` sub-metrics (see Interpreting results).

## Configuration (env vars)
| Var | Default | Meaning |
|---|---|---|
| `BEED_SID` | — (required) | `beed_sid` session cookie value |
| `BASE_URL` | `https://test-gatekeeper.beed.world/api` | Gatekeeper base URL (see Target environments) |
| `SERVICES` | `experio,hub,library` | which scenarios to run |
| `ENDPOINTS` | — (all) | comma-separated endpoint names to restrict the run to (see `endpoints/*`) |
| `VUS` | `25` | peak virtual users per service |
| `DURATION` | `1m` | steady-state hold |
| `THINK_TIME` | `1` | seconds a VU sleeps between iterations |

## Interpreting results
- `http_req_failed` rate must stay **< 1%** (threshold breach → non-zero exit, CI-friendly).
- `http_req_duration` p95 is checked per service via the `service:*` tag.
- Per-endpoint latency/error breakdown is available via the `name` tag (e.g. `lib:search`).
- A per-endpoint p95 sub-metric (`http_req_duration{name:...}`, loose 60s budget) is
  auto-generated for every endpoint that actually runs, so the breakdown also shows in
  the terminal summary and the web dashboard's **Summary** tab (the built-in dashboard
  doesn't fan out by tag on its own). Fill more ids in `data/ids.json` → more endpoints
  run → their sub-metrics appear automatically.

## Scope
- **Included:** read-only GETs (see `endpoints/*`).
- **Excluded by design:** writes, file/Excel downloads, and PDF generation — they
  mutate data or have a different (async/IO-bound) load profile. Test those separately.

## Adding an endpoint
Edit the relevant `endpoints/*.endpoints.js`:
```js
import { qs, randInt } from '../lib/data.js';

// simple path
{ name: 'lib:new-thing', needs: ['schoolId'], path: (p) => `/library/new-thing/${p('schoolId')}` }

// with query params + pagination (qs skips undefined and URL-encodes for you)
{ name: 'lib:list', path: (p, term) => `/library/list${qs({ q: term(), page: randInt(1, 3), pageSize: 20 })}` }
```
`needs` lists the id keys it requires; `path(pick, term)` builds the URL —
`pick(key)` draws a random id from the pool, `term()` a random raw search term.
Nothing else changes.

### Mirroring real endpoints (hub example)
`endpoints/hub.endpoints.js` reproduces the real **UI → Gatekeeper → Hub-API**
contract: list endpoints send `ownerId` + `hubRelation` + `status` + `page`/`pageSize`,
admin/educator hub detail require `ownerId`, and search suggestions need `ownerId` + a
≥2-char `q`. The Gatekeeper forwards `req.query` verbatim, so these params must match
the handlers. The pageable hub **detail / room** endpoints only fire once you add
`hubId` / `roomId` (and pre-paired ids) to `data/ids.json` — until then they skip.
