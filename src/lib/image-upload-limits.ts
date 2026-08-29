/** Shared client image upload size limits (before crop/compression). */

export const IMAGE_SOURCE_MAX_MB = 8;
export const IMAGE_SOURCE_MAX_BYTES = IMAGE_SOURCE_MAX_MB * 1024 * 1024;

export const MOONIE_IMAGE_MAX_MB = 10;
export const MOONIE_IMAGE_MAX_BYTES = MOONIE_IMAGE_MAX_MB * 1024 * 1024;

/** Max base64 payload length for Moonie image uploads (~4/3 of raw bytes). */
export const MOONIE_IMAGE_BASE64_MAX_CHARS = Math.ceil(
  (MOONIE_IMAGE_MAX_BYTES * 4) / 3
);

export function formatImageMaxMegabytes(
  bytes: number = IMAGE_SOURCE_MAX_BYTES
): string {
  const mb = bytes / (1024 * 1024);
  return Number.isInteger(mb) ? `${mb} MB` : `${mb.toFixed(1)} MB`;
}

export function imageSourceTooLargeMessage(label: string): string {
  return `${label} is too large. Choose a file under ${formatImageMaxMegabytes(IMAGE_SOURCE_MAX_BYTES)}.`;
}

export function moonieImageTooLargeMessage(): string {
  return `Image is too large. Please use a screenshot under ${formatImageMaxMegabytes(MOONIE_IMAGE_MAX_BYTES)}.`;
}
