/** Novel cover upload limits and validation (Writing Studio). */

import {
  compressDataUrlToMaxBytes,
  estimateDataUrlBytes,
} from "@/lib/image-crop-utils";
import {
  IMAGE_SOURCE_MAX_BYTES,
  imageSourceTooLargeMessage,
} from "@/lib/image-upload-limits";

export const NOVEL_COVER_MAX_BYTES = 400_000;
export const NOVEL_COVER_MAX_DIMENSION = 900;
export const NOVEL_COVER_ACCEPT = "image/jpeg,image/png,image/webp";

const DATA_URL_PATTERN =
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

const UPLOAD_PATH_PREFIX = "/uploads/novel-covers/";

export function isNovelCoverDataUrl(value: string): boolean {
  return DATA_URL_PATTERN.test(value.trim());
}

export function isNovelCoverUploadPath(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith(UPLOAD_PATH_PREFIX) &&
    !trimmed.includes("..") &&
    /\.(jpe?g|png|webp)$/i.test(trimmed)
  );
}

/** HTTPS URL, uploaded path, or compressed data URL from Writing Studio. */
export function isValidNovelCoverUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isNovelCoverDataUrl(trimmed)) {
    return trimmed.length <= 600_000;
  }
  if (isNovelCoverUploadPath(trimmed)) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export async function finalizeNovelCoverDataUrl(dataUrl: string): Promise<string> {
  const compressed = await compressDataUrlToMaxBytes(
    dataUrl,
    NOVEL_COVER_MAX_BYTES,
    [0.84, 0.72, 0.65, 0.5],
  );
  if (estimateDataUrlBytes(compressed) > NOVEL_COVER_MAX_BYTES) {
    throw new Error(
      "Cover is still too large after compression. Try a smaller image.",
    );
  }
  return compressed;
}

/** @deprecated Prefer the image crop flow; kept for legacy callers. */
export async function prepareNovelCoverFile(file: File): Promise<string> {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    throw new Error("Cover must be a JPEG, PNG, or WebP image.");
  }
  if (file.size > IMAGE_SOURCE_MAX_BYTES) {
    throw new Error(imageSourceTooLargeMessage("Cover image"));
  }

  const dataUrl = await resizeCoverToDataUrl(file);
  return finalizeNovelCoverDataUrl(dataUrl);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file."));
    };
    img.src = url;
  });
}

async function resizeCoverToDataUrl(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  const scale = Math.min(
    1,
    NOVEL_COVER_MAX_DIMENSION / Math.max(img.width, img.height),
  );
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process that image in this browser.");
  }
  ctx.drawImage(img, 0, 0, width, height);

  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  const quality = mime === "image/jpeg" ? 0.84 : undefined;
  return canvas.toDataURL(mime, quality);
}
