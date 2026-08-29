import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  NovelSeriesRelationType,
  PrismaClient,
  type Prisma,
} from "@prisma/client";

type VerifiedSeriesEntry = {
  title: string;
  order: number;
  relationType: keyof typeof NovelSeriesRelationType;
};

type VerifiedSeries = {
  name: string;
  description?: string;
  readingOrderVerified: boolean;
  entries: VerifiedSeriesEntry[];
};

type VerifiedSeriesFile = {
  version: number;
  description?: string;
  series: VerifiedSeries[];
};

const DATA_PATH = join(process.cwd(), "prisma/data/verified-novel-series.json");

export async function seedVerifiedNovelSeries(
  db: PrismaClient | Prisma.TransactionClient
): Promise<{ seeded: number; skipped: number }> {
  const raw = JSON.parse(readFileSync(DATA_PATH, "utf8")) as VerifiedSeriesFile;
  let seeded = 0;
  let skipped = 0;

  for (const series of raw.series) {
    const resolvedEntries: Array<{
      novelId: string;
      title: string;
      order: number;
      relationType: NovelSeriesRelationType;
    }> = [];

    for (const entry of series.entries) {
      const novel = await db.novel.findFirst({
        where: { title: { equals: entry.title, mode: "insensitive" } },
        select: { id: true, title: true },
      });
      if (!novel) {
        console.warn(
          `[seed-novel-series] Skipping ${series.name}: missing novel "${entry.title}"`
        );
        skipped += 1;
        break;
      }
      resolvedEntries.push({
        novelId: novel.id,
        title: novel.title,
        order: entry.order,
        relationType: NovelSeriesRelationType[entry.relationType],
      });
    }

    if (resolvedEntries.length !== series.entries.length) {
      continue;
    }

    const existing = await db.novelSeries.findFirst({
      where: { name: series.name },
      select: { id: true },
    });

    const row =
      existing ??
      (await db.novelSeries.create({
        data: {
          name: series.name,
          description: series.description ?? null,
          readingOrderVerified: series.readingOrderVerified,
        },
        select: { id: true },
      }));

    if (existing) {
      await db.novelSeries.update({
        where: { id: row.id },
        data: {
          description: series.description ?? null,
          readingOrderVerified: series.readingOrderVerified,
        },
      });
    }

    for (const entry of resolvedEntries) {
      await db.novelSeriesEntry.upsert({
        where: {
          seriesId_novelId: { seriesId: row.id, novelId: entry.novelId },
        },
        create: {
          seriesId: row.id,
          novelId: entry.novelId,
          order: entry.order,
          relationType: entry.relationType,
        },
        update: {
          order: entry.order,
          relationType: entry.relationType,
        },
      });
    }

    seeded += 1;
    console.log(
      `[seed-novel-series] ${series.name}: ${resolvedEntries
        .map((entry) => `${entry.order}. ${entry.title}`)
        .join(" → ")}`
    );
  }

  return { seeded, skipped };
}
