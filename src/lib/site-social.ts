/**
 * Optional public social / contact links.
 * Only URLs that are set are rendered in the footer.
 */
export type SocialLink = {
  id: "discord" | "github" | "twitter" | "bluesky" | "reddit" | "email";
  label: string;
  href: string;
};

function cleanUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function getSiteSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [];

  const discord = cleanUrl(process.env.NEXT_PUBLIC_DISCORD_URL);
  if (discord) links.push({ id: "discord", label: "Discord", href: discord });

  const github = cleanUrl(process.env.NEXT_PUBLIC_GITHUB_URL);
  if (github) links.push({ id: "github", label: "GitHub", href: github });

  const twitter = cleanUrl(process.env.NEXT_PUBLIC_TWITTER_URL);
  if (twitter) links.push({ id: "twitter", label: "X (Twitter)", href: twitter });

  const bluesky = cleanUrl(process.env.NEXT_PUBLIC_BLUESKY_URL);
  if (bluesky) links.push({ id: "bluesky", label: "Bluesky", href: bluesky });

  const reddit = cleanUrl(process.env.NEXT_PUBLIC_REDDIT_URL);
  if (reddit) links.push({ id: "reddit", label: "Reddit", href: reddit });

  const email = cleanUrl(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
  if (email) {
    links.push({
      id: "email",
      label: "Email",
      href: email.startsWith("mailto:") ? email : `mailto:${email}`,
    });
  }

  return links;
}
