#!/usr/bin/env node
/**
 * Simple HTTP server with CORS headers for SharedArrayBuffer support.
 * Required for pthread/WebAssembly threading.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.argv[2] || 8000;

process.chdir("docs");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
  ".ogg": "audio/ogg",
  ".sbg": "text/plain",
};

const server = http.createServer((req, res) => {
  let filePath = "." + req.url;
  if (filePath === "./") {
    filePath = "./index.html";
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = MIME_TYPES[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 Not Found</h1>", "utf-8");
      } else {
        res.writeHead(500);
        res.end("Server Error: " + error.code, "utf-8");
      }
    } else {
      // Required headers for SharedArrayBuffer/pthreads
      res.writeHead(200, {
        "Content-Type": mimeType,
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log("Serving with SharedArrayBuffer support enabled");
  console.log("Press Ctrl+C to stop");
});
