export interface CommunityLane {
  id: string;
  label: string;
  kind: "genre" | "mood";
  match: string[];
}

const MOOD_LANES: CommunityLane[] = [
  {
    id: "slow-burn",
    label: "Slow-burn",
    kind: "mood",
    match: ["slow-burn"],
  },
  {
    id: "cozy",
    label: "Cozy",
    kind: "mood",
    match: ["slice-of-life", "fluff", "found-family", "school-life"],
  },
  {
    id: "dark",
    label: "Dark",
    kind: "mood",
    match: ["cosmic-horror", "dark", "angst", "tragedy"],
  },
  {
    id: "academy",
    label: "Academy",
    kind: "mood",
    match: ["magic-academy", "school-life"],
  },
];

export function buildCommunityLanes(
  genres: { name: string; slug: string }[]
): CommunityLane[] {
  const genreLanes = genres.slice(0, 5).map((genre) => ({
    id: `genre:${genre.slug}`,
    label: genre.name,
    kind: "genre" as const,
    match: [genre.name, genre.slug],
  }));
  return [...genreLanes, ...MOOD_LANES];
}

function normalizeLaneToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function resolveCommunityLane(
  lanes: CommunityLane[],
  token: string
): CommunityLane {
  const normalized = normalizeLaneToken(token);
  const found = lanes.find(
    (lane) =>
      lane.id === token ||
      lane.id === `genre:${normalized}` ||
      lane.match.some((match) => normalizeLaneToken(match) === normalized)
  );
  if (found) return found;

  const label = token
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    id: `salon:${normalized}`,
    label: label || token,
    kind: "mood",
    match: [token, normalized, label.toLowerCase()],
  };
}

export function reviewMatchesLane(
  review: { genres: string[]; tags: string[] },
  lane: CommunityLane
): boolean {
  const haystack = [...review.genres, ...review.tags].map((value) =>
    value.toLowerCase().replace(/\s+/g, "-")
  );
  return lane.match.some((token) => {
    const needle = token.toLowerCase().replace(/\s+/g, "-");
    return haystack.some(
      (entry) =>
        entry === needle || entry.includes(needle) || needle.includes(entry)
    );
  });
}
