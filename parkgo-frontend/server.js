/**
 * Static file server for the built SPA, with the deep-link fallback baked in.
 *
 * Why this exists instead of a plain static host:
 *
 * React Router uses BrowserRouter (real URLs, no #). When a user refreshes on
 * /subscriber, the browser asks the *server* for /subscriber — a path that has
 * no file behind it, because the whole app is one index.html. A static host
 * answers 404 ("Not Found") and the user sees a blank page.
 *
 * The usual fix is a host-level rewrite rule. We previously relied on a
 * `public/_redirects` file, but that is a Netlify convention — Render ignores
 * it and simply serves it as a static file, so the rule never applied and every
 * refresh 404'd. Render's own rewrite lives in dashboard settings, which is
 * invisible to this repo and easy to lose on a service rebuild.
 *
 * Serving the app from here keeps the fallback in version control, so it works
 * on any host that can run Node, and cannot silently drift out of sync again.
 *
 * Zero dependencies — Node's built-in http/fs only, so this adds nothing to the
 * install and cannot break on a transitive update.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const DIST = resolve(import.meta.dirname, 'dist');
const PORT = Number(process.env.PORT) || 4173;
const INDEX = join(DIST, 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

if (!existsSync(INDEX)) {
  console.error(
    `[static] No build found at ${DIST}. Run "npm run build" before starting.`
  );
  process.exit(1);
}

/**
 * Resolve a URL path to a real file inside dist, or null.
 * Returns null for anything that escapes dist (path traversal) or isn't a file.
 */
const resolveFile = (urlPath) => {
  // Strip the query/hash, then decode. A malformed escape throws — treat it as
  // no match rather than crashing the request.
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch {
    return null;
  }

  const candidate = resolve(DIST, '.' + normalize(decoded));
  // Containment check: must be dist itself or sit beneath it.
  if (candidate !== DIST && !candidate.startsWith(DIST + sep)) return null;

  return existsSync(candidate) && statSync(candidate).isFile() ? candidate : null;
};

const send = (res, status, file, { immutable = false } = {}) => {
  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(status, {
    'Content-Type': type,
    // Hashed asset filenames change on every build, so they can be cached hard.
    // index.html must never be cached, or users keep booting a stale bundle
    // that references deleted asset hashes.
    'Cache-Control': immutable
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(file).pipe(res);
};

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method Not Allowed');
    return;
  }

  const file = resolveFile(req.url || '/');

  if (file) {
    // Vite emits hashed filenames into /assets — safe to cache immutably.
    send(res, 200, file, { immutable: req.url.startsWith('/assets/') });
    return;
  }

  // No file matched: this is a client-side route. Serve the app and let React
  // Router render it — including its own styled 404 for genuinely bad paths.
  // Status is 200 because the SPA *is* the correct response for these URLs.
  send(res, 200, INDEX);
});

server.listen(PORT, () => {
  console.log(`\nParkGo frontend served on http://localhost:${PORT}`);
  console.log(`  root:     ${DIST}`);
  console.log(`  fallback: index.html (SPA deep links enabled)\n`);
});
