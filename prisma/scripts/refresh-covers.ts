/**
 * One-off: replace picsum placeholder covers with real publisher / Wikimedia covers.
 * Usage: npx tsx prisma/scripts/refresh-covers.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  isTrustedCoverUrl,
  resolveNovelCoverUrl,
} from "../lib/open-library-covers";

const db = new PrismaClient();

async function main() {
  const novels = await db.novel.findMany({
    where: {
      OR: [{ coverUrl: null }, { coverUrl: { contains: "picsum.photos" } }],
    },
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      externalLink: true,
      readingLinks: { select: { url: true } },
    },
    orderBy: { title: "asc" },
  });

  console.log(`Found ${novels.length} novels needing real covers…`);

  let updated = 0;
  let failed = 0;

  for (const novel of novels) {
    const readingUrls = novel.readingLinks.map((l) => l.url);
    const royalRoadUrl = [novel.externalLink, ...readingUrls].find((u) =>
      /royalroad\.com\/fiction\//i.test(u ?? "")
    );
    const coverUrl = await resolveNovelCoverUrl(novel.title, novel.author ?? "", {
      externalLink: novel.externalLink ?? undefined,
      readingUrls,
    });

    const trusted =
      !!coverUrl &&
      !coverUrl.includes("picsum.photos") &&
      (coverUrl.includes("openlibrary.org") ||
        isTrustedCoverUrl(coverUrl, {
          title: novel.title,
          royalRoadUrl,
        }));

    if (!trusted || !coverUrl) {
      failed += 1;
      console.log(`  · miss  ${novel.title}`);
      await new Promise((r) => setTimeout(r, 120));
      continue;
    }

    await db.novel.update({
      where: { id: novel.id },
      data: { coverUrl },
    });
    updated += 1;
    console.log(`  · ok    ${novel.title}`);
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`\nDone. Updated ${updated}, still missing ${failed}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
