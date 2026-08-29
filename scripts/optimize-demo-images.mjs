#!/usr/bin/env node
/**
 * Optimise demo profile PNGs under public/demo/avatars and public/demo/banners.
 *
 * Default: dry-run (in-memory only). Pass --write to replace files atomically.
 *
 * Usage:
 *   npm run demo:images:optimize
 *   npm run demo:images:optimize -- --write
 *
 * Two-phase process:
 *   1. Read and optimise every PNG into memory. Validate each result.
 *      No original files are replaced in this phase.
 *      If any file fails, exit non-zero and write nothing.
 *   2. In --write mode only, atomically replace files whose optimised
 *      buffer is strictly smaller than the original.
 */

import { randomBytes } from "node:crypto";
import { readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const GROUPS = [
  {
    name: "avatars",
    dir: path.join(ROOT, "public", "demo", "avatars"),
    maxWidth: 512,
    maxHeight: 512,
  },
  {
    name: "banners",
    dir: path.join(ROOT, "public", "demo", "banners"),
    maxWidth: 1024,
    maxHeight: 1024,
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function listPngFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

async function optimisePng(filePath, maxWidth, maxHeight) {
  return sharp(filePath, { failOn: "error" })
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 85,
    })
    .toBuffer();
}

async function validateOptimisedBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("optimisation produced an empty or invalid buffer");
  }
  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error("optimisation did not produce a PNG");
  }

  const meta = await sharp(buffer, { failOn: "error" }).metadata();
  if (meta.format !== "png") {
    throw new Error(`optimisation produced ${meta.format ?? "unknown"} instead of PNG`);
  }
  if (!meta.width || !meta.height) {
    throw new Error("optimisation produced a PNG without dimensions");
  }
}

async function atomicReplace(targetPath, buffer) {
  const tmpPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`,
  );

  try {
    await writeFile(tmpPath, buffer);
    await rename(tmpPath, targetPath);
  } catch (error) {
    await unlink(tmpPath).catch(() => {});
    throw error;
  }
}

function emptyGroupStats(name) {
  return {
    name,
    count: 0,
    processed: 0,
    skipped: 0,
    ready: 0,
    written: 0,
    failed: 0,
    originalBytes: 0,
    resultBytes: 0,
  };
}

function addToStats(stats, record) {
  stats.count += 1;
  stats.originalBytes += record.originalBytes;
  stats.resultBytes += record.resultBytes;
  if (record.status === "failed") {
    stats.failed += 1;
    return;
  }
  stats.processed += 1;
  if (record.status === "skipped") stats.skipped += 1;
  if (record.status === "ready") stats.ready += 1;
  if (record.status === "written") stats.written += 1;
}

function printTotals(label, stats) {
  const saved = stats.originalBytes - stats.resultBytes;
  const savedPct =
    stats.originalBytes > 0 ? ((saved / stats.originalBytes) * 100).toFixed(1) : "0.0";
  console.log(
    `${label}: ${stats.count} PNG(s) | ${stats.originalBytes} B (${formatBytes(stats.originalBytes)}) → ${stats.resultBytes} B (${formatBytes(stats.resultBytes)}) (${saved >= 0 ? "saved" : "grew"} ${formatBytes(Math.abs(saved))}, ${savedPct}%)`,
  );
  console.log(
    `${label} counts: processed=${stats.processed} skipped=${stats.skipped} ready=${stats.ready} written=${stats.written} failed=${stats.failed}`,
  );
}

async function collectJobs() {
  const jobs = [];
  for (const group of GROUPS) {
    const files = await listPngFiles(group.dir);
    for (const filePath of files) {
      jobs.push({
        groupName: group.name,
        maxWidth: group.maxWidth,
        maxHeight: group.maxHeight,
        filePath,
        relative: path.relative(ROOT, filePath),
      });
    }
  }
  return jobs;
}

async function phase1Optimise(jobs) {
  console.log("Phase 1: optimise and validate all PNGs in memory (no files written)\n");
  const records = [];

  for (const job of jobs) {
    try {
      const originalBytes = (await stat(job.filePath)).size;
      const buffer = await optimisePng(job.filePath, job.maxWidth, job.maxHeight);
      await validateOptimisedBuffer(buffer);

      const skip = buffer.length >= originalBytes;
      const resultBytes = skip ? originalBytes : buffer.length;
      const delta = buffer.length - originalBytes;
      const deltaLabel = `${delta >= 0 ? "+" : "-"}${formatBytes(Math.abs(delta))}`;

      if (skip) {
        console.log(
          `  SKIP ${job.relative}: ${formatBytes(originalBytes)} → ${formatBytes(buffer.length)} (${deltaLabel}; unchanged)`,
        );
        records.push({
          ...job,
          originalBytes,
          resultBytes,
          buffer: null,
          status: "skipped",
        });
      } else {
        console.log(
          `  OK   ${job.relative}: ${formatBytes(originalBytes)} → ${formatBytes(buffer.length)} (${deltaLabel})`,
        );
        records.push({
          ...job,
          originalBytes,
          resultBytes,
          buffer,
          status: "ready",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ERROR ${job.relative}: ${message}`);
      records.push({
        ...job,
        originalBytes: 0,
        resultBytes: 0,
        buffer: null,
        status: "failed",
        message,
      });
    }
  }

  return records;
}

async function phase2Write(records) {
  console.log("\nPhase 2: atomic replace for files that shrank\n");
  let written = 0;
  let failed = 0;

  for (const record of records) {
    if (record.status !== "ready") continue;

    try {
      await atomicReplace(record.filePath, record.buffer);
      record.status = "written";
      record.buffer = null;
      written += 1;
      console.log(`  WROTE ${record.relative}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      record.status = "failed";
      record.message = message;
      record.buffer = null;
      failed += 1;
      console.error(`  ERROR ${record.relative}: ${message}`);
    }
  }

  return { written, failed };
}

async function main() {
  console.log(
    WRITE
      ? "Demo image optimisation — WRITE mode (atomic replace after successful Phase 1)\n"
      : "Demo image optimisation — dry-run (no files will be written)\n",
  );

  const jobs = await collectJobs();
  const records = await phase1Optimise(jobs);
  const phase1Failed = records.filter((record) => record.status === "failed").length;

  if (phase1Failed > 0) {
    console.error(
      `\nPhase 1 failed for ${phase1Failed} file(s). No image files were written.`,
    );
    printSummary(records);
    process.exitCode = 1;
    return;
  }

  if (WRITE) {
    const { failed } = await phase2Write(records);
    printSummary(records);
    if (failed > 0) {
      console.error(`\nPhase 2 failed for ${failed} file(s). Successful replacements were kept.`);
      process.exitCode = 1;
      return;
    }
    console.log("\nWrite complete. Original PNG paths and extensions were preserved.");
    process.exitCode = 0;
    return;
  }

  printSummary(records);
  console.log("\nDry-run complete. Re-run with --write to replace files that shrank.");
  process.exitCode = 0;
}

function printSummary(records) {
  console.log("");
  const byGroup = new Map(GROUPS.map((group) => [group.name, emptyGroupStats(group.name)]));
  const total = emptyGroupStats("total");

  for (const record of records) {
    const stats = byGroup.get(record.groupName) ?? emptyGroupStats(record.groupName);
    addToStats(stats, record);
    addToStats(total, record);
    byGroup.set(record.groupName, stats);
  }

  for (const group of GROUPS) {
    printTotals(group.name, byGroup.get(group.name));
  }
  printTotals("total", total);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Fatal: ${message}`);
  console.error("No image files were written.");
  process.exitCode = 1;
}
