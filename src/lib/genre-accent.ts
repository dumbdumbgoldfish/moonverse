const HUES = [272, 304, 228, 198, 338, 248];

export function genreAccentColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % HUES.length;
  }
  return `hsl(${HUES[hash]} 42% 52%)`;
}
