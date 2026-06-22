// npm-friendly k6 launcher.
// k6 does NOT auto-load .env, so this wrapper parses .env into the process
// environment (which k6 inherits as __ENV) and then execs `k6` with whatever
// args the npm script passed through. Real shell env vars win over .env so you
// can still override per-run, e.g. `VUS=1 npm test`.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
} else {
  console.warn('No .env found — relying on shell env / -e flags only.');
}

// Resolve the k6 binary. Prefer PATH; otherwise fall back to the winget default
// install location (Windows), since a terminal opened before install won't have
// the refreshed PATH yet.
function resolveK6() {
  const probe = spawnSync('k6', ['version'], { stdio: 'ignore', shell: true });
  if (probe.status === 0) return 'k6';
  const fallback = 'C:\\Program Files\\k6\\k6.exe';
  // Quoted because the path contains a space and we spawn with shell: true.
  if (process.platform === 'win32' && fs.existsSync(fallback)) return `"${fallback}"`;
  return 'k6'; // let it fail with the normal "not recognized" message
}

// Wrapper-only flags: consumed here (not forwarded to k6). Everything else passes
// through to k6 untouched.
//   --dashboard          live built-in dashboard at http://localhost:5665 (no extra infra)
//   --report[=file.html] export a self-contained HTML report (default: html-report.html)
const k6Args = [];
for (const arg of process.argv.slice(2)) {
  if (arg === '--dashboard') {
    process.env.K6_WEB_DASHBOARD = 'true';
  } else if (arg === '--report' || arg.startsWith('--report=')) {
    process.env.K6_WEB_DASHBOARD = 'true';
    const eq = arg.indexOf('=');
    process.env.K6_WEB_DASHBOARD_EXPORT = eq === -1 ? 'html-report.html' : arg.slice(eq + 1);
  } else {
    k6Args.push(arg);
  }
}

const result = spawnSync(resolveK6(), k6Args, {
  stdio: 'inherit',
  shell: true,
});
process.exit(result.status ?? 1);
