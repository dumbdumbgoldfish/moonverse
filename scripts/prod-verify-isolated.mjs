/**
 * Isolated production build/start for acceptance smoke without touching `.next`.
 * Requires NEXT_MOONVERSE_DIST_DIR in next.config.ts (unset → default `.next`).
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = ".next-prod-verify";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        NEXT_MOONVERSE_DIST_DIR: distDir,
      },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

const mode = process.argv[2];

if (mode === "build") {
  await run("npx", ["prisma", "generate"]);
  await run("node", ["node_modules/next/dist/bin/next", "build", "--webpack"]);
  const buildIdPath = path.join(repoRoot, distDir, "BUILD_ID");
  if (!existsSync(buildIdPath)) {
    throw new Error(`Missing BUILD_ID at ${buildIdPath}`);
  }
  console.log("BUILD_ID:", readFileSync(buildIdPath, "utf8").trim());
  console.log("distDir:", distDir);
  console.log("next:", readFileSync(
    path.join(repoRoot, "node_modules/next/package.json"),
    "utf8"
  ).match(/"version": "([^"]+)"/)?.[1]);
} else if (mode === "start") {
  const port = process.argv[3] || "3001";
  await run("node", [
    "node_modules/next/dist/bin/next",
    "start",
    "-p",
    port,
    "-H",
    "127.0.0.1",
  ]);
} else {
  console.error("Usage: node scripts/prod-verify-isolated.mjs build|start [port]");
  process.exit(1);
}
