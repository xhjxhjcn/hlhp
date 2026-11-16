/**
 * Zero-dependency static preview server for dist/.
 * Usage: node tools/serve.mjs [port]
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

if (!existsSync(DIST)) {
  console.error("dist/ is missing — run `npm run build` first.");
  process.exit(1);
}

createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  let filePath = join(DIST, normalize(urlPath).replace(/^(\.\.[/\\])+/, ""));

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }
  if (!existsSync(filePath) && existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  }
  if (!existsSync(filePath)) {
    filePath = join(DIST, "404.html");
    res.statusCode = 404;
  }

  const type = TYPES[extname(filePath).toLowerCase()] || "application/octet-stream";
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", "no-cache");
  createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`serving dist/ at http://127.0.0.1:${PORT}`);
});
