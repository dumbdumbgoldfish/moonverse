/** Facebook-style compact counts: 46, 1.2K, 20.9K, 10K, 1.2M */
export function formatEngagementCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    if (thousands >= 10 && Number.isInteger(thousands)) {
      return `${thousands}K`;
    }
    return `${thousands.toFixed(1).replace(/\.0$/, "")}K`;
  }
  const millions = value / 1_000_000;
  if (millions >= 10 && Number.isInteger(millions)) {
    return `${millions}M`;
  }
  return `${millions.toFixed(1).replace(/\.0$/, "")}M`;
}
