/** Normalized label equality for Moonie preference ↔ catalogue matching. */

export function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

export function slugifyLabel(value: string): string {
  return normalizeLabel(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function labelsMatch(catalogueLabel: string, preferenceLabel: string): boolean {
  const catalogue = normalizeLabel(catalogueLabel);
  const preference = normalizeLabel(preferenceLabel);
  if (!catalogue || !preference) return false;
  if (catalogue === preference) return true;
  return slugifyLabel(catalogueLabel) === slugifyLabel(preferenceLabel);
}

/** Returns preference labels that genuinely match catalogue labels. */
export function matchedPreferenceLabels(
  catalogueLabels: string[],
  preferenceLabels: string[]
): string[] {
  const hits: string[] = [];
  for (const preference of preferenceLabels) {
    if (!preference.trim()) continue;
    if (catalogueLabels.some((label) => labelsMatch(label, preference))) {
      hits.push(preference);
    }
  }
  return hits;
}
