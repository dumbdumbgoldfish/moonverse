/** Open Library: free public book metadata (https://openlibrary.org/developers/api) */

export interface OpenLibraryBook {
  title: string;
  author: string;
  coverUrl: string | null;
  openLibraryUrl: string;
  publishYear?: number;
}

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibraryDoc[];
}

export interface SubjectFetchConfig {
  subject: string;
  limit: number;
}

export async function fetchBooksBySubject(
  subject: string,
  limit: number
): Promise<OpenLibraryBook[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("subject", subject);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set(
    "fields",
    "key,title,author_name,cover_i,first_publish_year"
  );

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "MoonVerse/1.0 (educational; moonverse-seed)" },
  });

  if (!response.ok) {
    throw new Error(`Open Library request failed (${response.status}) for ${subject}`);
  }

  const data = (await response.json()) as OpenLibrarySearchResponse;
  const books: OpenLibraryBook[] = [];

  for (const doc of data.docs ?? []) {
    if (!doc.title?.trim() || !doc.author_name?.[0] || !doc.key) continue;

    const title = doc.title.trim().replace(/\s+/g, " ");
    if (title.length > 180) continue;

    books.push({
      title,
      author: doc.author_name[0],
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null,
      openLibraryUrl: `https://openlibrary.org${doc.key}`,
      publishYear: doc.first_publish_year,
    });
  }

  return books;
}

export async function fetchPublicCatalog(
  configs: SubjectFetchConfig[]
): Promise<OpenLibraryBook[]> {
  const seen = new Set<string>();
  const catalog: OpenLibraryBook[] = [];

  for (const { subject, limit } of configs) {
    const books = await fetchBooksBySubject(subject, limit);
    for (const book of books) {
      const key = book.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      catalog.push(book);
    }
    // Throttle requests to respect Open Library's public API.
    await new Promise((r) => setTimeout(r, 300));
  }

  return catalog;
}

export function fallbackCoverUrl(_title: string): string | null {
  // Never seed fake picsum covers: UI uses a designed MoonVerse fallback when null.
  return null;
}
