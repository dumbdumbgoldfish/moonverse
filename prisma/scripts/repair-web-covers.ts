/**
 * Re-validate and repair covers for curated web novels.
 * Clears untrusted Royal Road / Wikipedia mismatches, then re-resolves.
 *
 * Usage: npx tsx prisma/scripts/repair-web-covers.ts
 */
import { PrismaClient } from "@prisma/client";
import { ENGLISH_WEB_NOVELS } from "../lib/english-web-novels";
import { TRANSLATED_CN_NOVELS } from "../lib/translated-cn-novels";
import {
  isTrustedCoverUrl,
  normalizeTitleKey,
  resolveNovelCoverUrl,
  searchOpenLibraryCover,
} from "../lib/open-library-covers";

const db = new PrismaClient();

const CATALOG = [...ENGLISH_WEB_NOVELS, ...TRANSLATED_CN_NOVELS];

async function coverStillValid(input: {
  title: string;
  author: string;
  coverUrl: string | null;
  royalRoadUrl?: string | null;
}): Promise<boolean> {
  const { title, author, coverUrl, royalRoadUrl } = input;
  if (!coverUrl) return false;

  if (coverUrl.includes("openlibrary.org")) {
    const strict = await searchOpenLibraryCover(title, author);
    const curId = coverUrl.match(/\/b\/id\/(\d+)/)?.[1];
    const newId = strict?.match(/\/b\/id\/(\d+)/)?.[1];
    return Boolean(curId && newId && curId === newId);
  }

  return isTrustedCoverUrl(coverUrl, {
    title,
    royalRoadUrl,
  });
}

async function main() {
  const novels = await db.novel.findMany({
    where: {
      OR: CATALOG.map((entry) => ({
        title: { equals: entry.title, mode: "insensitive" as const },
      })),
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

  const catalogKeys = new Set(CATALOG.map((n) => normalizeTitleKey(n.title)));
  const seen = new Set<string>();
  const targets = novels.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return catalogKeys.has(normalizeTitleKey(n.title));
  });

  console.log(`Repairing covers for ${targets.length} curated web novels…`);

  let cleared = 0;
  let updated = 0;
  let kept = 0;
  let stillMissing = 0;

  for (const novel of targets) {
    const readingUrls = novel.readingLinks.map((l) => l.url);
    const royalRoadUrl = [novel.externalLink, ...readingUrls].find((u) =>
      /royalroad\.com\/fiction\//i.test(u ?? "")
    );

    const valid = await coverStillValid({
      title: novel.title,
      author: novel.author ?? "",
      coverUrl: novel.coverUrl,
      royalRoadUrl,
    });

    if (valid) {
      kept += 1;
      continue;
    }

    if (novel.coverUrl) {
      await db.novel.update({
        where: { id: novel.id },
        data: { coverUrl: null },
      });
      cleared += 1;
      console.log(`  · clear ${novel.title}`);
    }

    const coverUrl = await resolveNovelCoverUrl(
      novel.title,
      novel.author ?? "",
      {
        externalLink: novel.externalLink ?? undefined,
        readingUrls,
      }
    );

    if (!coverUrl || coverUrl.includes("picsum.photos")) {
      stillMissing += 1;
      console.log(`  · miss  ${novel.title}`);
    } else {
      const ok =
        coverUrl.includes("openlibrary.org") ||
        isTrustedCoverUrl(coverUrl, {
          title: novel.title,
          royalRoadUrl,
        });
      if (!ok) {
        stillMissing += 1;
        console.log(`  · reject ${novel.title}`);
      } else {
        await db.novel.update({
          where: { id: novel.id },
          data: { coverUrl },
        });
        updated += 1;
        console.log(`  · ok    ${novel.title}`);
      }
    }

    await new Promise((r) => setTimeout(r, 140));
  }

  console.log(
    `\nDone. Kept ${kept}, cleared ${cleared}, updated ${updated}, still missing ${stillMissing}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
