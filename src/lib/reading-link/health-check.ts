import { ReadingLinkHealthStatus } from "@prisma/client";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const CHECK_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80")) return true;
  return false;
}

export function isUrlSafeForHealthCheck(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) return false;
  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return false;
  }

  if (isIP(hostname)) {
    if (hostname.includes(":")) return !isPrivateIpv6(hostname);
    return !isPrivateIpv4(hostname);
  }

  return true;
}

async function resolveHostIsPublic(hostname: string): Promise<boolean> {
  if (isIP(hostname)) {
    if (hostname.includes(":")) return !isPrivateIpv6(hostname);
    return !isPrivateIpv4(hostname);
  }

  try {
    const records = await lookup(hostname, { all: true, verbatim: true });
    for (const record of records) {
      if (record.family === 4 && isPrivateIpv4(record.address)) return false;
      if (record.family === 6 && isPrivateIpv6(record.address)) return false;
    }
    return records.length > 0;
  } catch {
    return false;
  }
}

export interface ReadingLinkHealthCheckResult {
  healthStatus: ReadingLinkHealthStatus;
  lastStatusCode: number | null;
  checkedAt: Date;
}

async function fetchWithRedirects(
  url: string,
  method: "HEAD" | "GET"
): Promise<Response> {
  let current = url;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    try {
      const response = await fetch(current, {
        method,
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "MoonVerse-LinkChecker/1.0" },
      });
      clearTimeout(timeout);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirectCount === MAX_REDIRECTS) {
          return response;
        }
        const next = new URL(location, current);
        if (!isUrlSafeForHealthCheck(next.toString())) {
          throw new Error("unsafe_redirect");
        }
        const publicHost = await resolveHostIsPublic(next.hostname);
        if (!publicHost) throw new Error("private_redirect");
        current = next.toString();
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  throw new Error("redirect_limit");
}

export async function checkReadingLinkHealth(
  rawUrl: string
): Promise<ReadingLinkHealthCheckResult> {
  const checkedAt = new Date();

  if (!isUrlSafeForHealthCheck(rawUrl)) {
    return {
      healthStatus: ReadingLinkHealthStatus.BROKEN,
      lastStatusCode: null,
      checkedAt,
    };
  }

  const hostname = new URL(rawUrl).hostname;
  const publicHost = await resolveHostIsPublic(hostname);
  if (!publicHost) {
    return {
      healthStatus: ReadingLinkHealthStatus.BROKEN,
      lastStatusCode: null,
      checkedAt,
    };
  }

  try {
    let response = await fetchWithRedirects(rawUrl, "HEAD");
    if (response.status === 405 || response.status === 501) {
      response = await fetchWithRedirects(rawUrl, "GET");
    }

    const status = response.status;
    if (status >= 200 && status < 300) {
      return {
        healthStatus: ReadingLinkHealthStatus.HEALTHY,
        lastStatusCode: status,
        checkedAt,
      };
    }
    if (status >= 300 && status < 400) {
      return {
        healthStatus: ReadingLinkHealthStatus.REDIRECTED,
        lastStatusCode: status,
        checkedAt,
      };
    }
    if (status === 404 || status === 410 || status >= 500) {
      return {
        healthStatus: ReadingLinkHealthStatus.BROKEN,
        lastStatusCode: status,
        checkedAt,
      };
    }
    return {
      healthStatus: ReadingLinkHealthStatus.STALE,
      lastStatusCode: status,
      checkedAt,
    };
  } catch {
    return {
      healthStatus: ReadingLinkHealthStatus.BROKEN,
      lastStatusCode: null,
      checkedAt,
    };
  }
}

export function isReadingLinkStale(lastCheckedAt: Date | null | undefined): boolean {
  if (!lastCheckedAt) return true;
  return Date.now() - lastCheckedAt.getTime() > STALE_AFTER_MS;
}

export function isPromotableReadingLinkHealth(
  status: ReadingLinkHealthStatus | string,
  lastCheckedAt: Date | null | undefined
): boolean {
  if (status === ReadingLinkHealthStatus.BROKEN || status === "BROKEN") {
    return false;
  }
  if (
    (status === ReadingLinkHealthStatus.STALE || status === "STALE") &&
    isReadingLinkStale(lastCheckedAt)
  ) {
    return false;
  }
  return true;
}

export function readingLinkHealthNote(options: {
  healthStatus: ReadingLinkHealthStatus;
  lastCheckedAt: Date | null | undefined;
  badge: "official" | "verified" | "community" | "unverified";
}): string | null {
  const { healthStatus, lastCheckedAt, badge } = options;
  if (healthStatus === ReadingLinkHealthStatus.BROKEN) {
    return "This source may be unavailable.";
  }
  if (
    healthStatus === ReadingLinkHealthStatus.UNKNOWN &&
    isReadingLinkStale(lastCheckedAt)
  ) {
    return "This source hasn't been checked recently.";
  }
  if (healthStatus === ReadingLinkHealthStatus.STALE) {
    return "This source hasn't been checked recently.";
  }
  if (
    (badge === "official" || badge === "verified") &&
    healthStatus === ReadingLinkHealthStatus.HEALTHY &&
    lastCheckedAt
  ) {
    return "Recently checked";
  }
  return null;
}
