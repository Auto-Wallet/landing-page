// Tiny static file server for local development.
// Run: bun run dev

import { file } from "bun";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(import.meta.dir);
const PORT = Number(process.env.PORT ?? 5173);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    // prevent path traversal
    const safePath = normalize(join(ROOT, pathname));
    if (!safePath.startsWith(ROOT)) {
      return new Response("Forbidden", { status: 403 });
    }

    const f = file(safePath);
    if (!(await f.exists())) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(f, {
      headers: {
        "content-type": MIME[extname(safePath).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "no-cache",
      },
    });
  },
});

console.log(`Auto Wallet landing → http://localhost:${server.port}`);
