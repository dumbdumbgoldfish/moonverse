#!/usr/bin/env node
/**
 * Next.js dev/start wrapper with a larger max HTTP header size.
 * Needed once to recover sessions that previously stored base64 avatars in JWT cookies (HTTP 431).
 */
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";

const dev = process.argv.includes("--dev");
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);
const maxHeaderSize = Number(process.env.MAX_HTTP_HEADER_SIZE ?? 1024 * 1024);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

createServer({ maxHeaderSize }, async (req, res) => {
  try {
    const parsedUrl = parse(req.url ?? "", true);
    await handle(req, res, parsedUrl);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}).listen(port, hostname, () => {
  console.log(
    `> MoonVerse ready on http://${hostname}:${port} (maxHeaderSize=${maxHeaderSize})`,
  );
});
