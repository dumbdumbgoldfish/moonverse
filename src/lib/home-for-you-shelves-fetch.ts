import type { ForYouShelfData } from "@/services/home-shelves.service";

export type ForYouShelvesLoadState = "loading" | "success" | "empty" | "error";

export class HomeShelvesFetchError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("home_shelves_fetch_failed");
    this.name = "HomeShelvesFetchError";
    this.status = status;
  }
}

export function resolveForYouShelvesLoadState(options: {
  loading: boolean;
  error: boolean;
  shelves: ForYouShelfData[] | null;
}): ForYouShelvesLoadState {
  if (options.loading) return "loading";
  if (options.error) return "error";
  if (!options.shelves || options.shelves.length === 0) return "empty";
  return "success";
}

export async function fetchHomeForYouShelves(
  fetchImpl: typeof fetch = fetch
): Promise<ForYouShelfData[]> {
  const response = await fetchImpl("/api/home/shelves", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new HomeShelvesFetchError(response.status);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new HomeShelvesFetchError(502);
  }

  return payload as ForYouShelfData[];
}
