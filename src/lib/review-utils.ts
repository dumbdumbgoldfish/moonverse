export const DEFAULT_COVER_URL =
  "https://picsum.photos/seed/moonverse-default/200/280";

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function excerpt(text: string, maxLength = 150): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function resolveCoverUrl(coverUrl: string | null | undefined): string {
  return coverUrl ?? DEFAULT_COVER_URL;
}
