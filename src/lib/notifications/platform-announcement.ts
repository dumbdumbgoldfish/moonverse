const PLATFORM_PREFIX = /^\[Platform\]\s*/i;

export function isPlatformAnnouncementMessage(message: string): boolean {
  return PLATFORM_PREFIX.test(message.trimStart());
}

export function parsePlatformAnnouncementMessage(message: string): string {
  return message.replace(PLATFORM_PREFIX, "").trim();
}

export const PLATFORM_ANNOUNCEMENT_HEADLINE = "MoonVerse · System announcement";
