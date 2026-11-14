// A tiny static server for the e2e tests: serves the directory in E2E_DIR (default dist/) on PORT. No events.json in there:
// the tests answer it from web/e2e/fixture with page.route / context.route.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.env.E2E_DIR || "dist");
const port = Number(process.env.PORT || 4319);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webmanifest": "application/manifest+json",
  ".ics": "text/calendar",
};

createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (p.endsWith("/")) p += "index.html";
  const file = join(root, p);
  try {
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw 0;
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`serving ${root} on http://127.0.0.1:${port}/`));
