'use strict';

// Runs as `predev` before `npm run dev` (see package.json) — frees the dev
// server's port if a previous, stale Vite instance is still holding it.
// This is exactly what caused the "CORS blocked" / "Failed to fetch"
// confusion earlier: an old dev server kept serving the game on its
// expected port with an outdated config, while the browser was pointed at
// it instead of a fresh instance. Killing anything on the port first means
// `npm run dev` always starts a genuinely fresh instance, and `strictPort`
// in vite.config.js means it fails loudly (not a silent port drift) if
// something still won't budge.
const { execSync } = require('child_process');

const port = process.argv[2];
if (!port) process.exit(0);

try {
  const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
  const pids = new Set();
  output.split('\n').forEach((line) => {
    const match = line.trim().match(/LISTENING\s+(\d+)\s*$/);
    if (match) pids.add(match[1]);
  });

  pids.forEach((pid) => {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`[predev] freed port ${port} (stopped leftover process ${pid})`);
    } catch (_) {
      // Already gone, or not killable (permissions) — either way, `dev` will
      // surface a clear error itself (strictPort) if the port is still stuck.
    }
  });
} catch (_) {
  // netstat/findstr find nothing → nothing listening on the port. Fine, no-op.
}
