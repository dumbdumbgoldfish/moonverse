/** Profile avatar upload limits and validation. */

import {
  compressDataUrlToMaxBytes,
  estimateDataUrlBytes,
} from "@/lib/image-crop-utils";
import {
  IMAGE_SOURCE_MAX_BYTES,
  imageSourceTooLargeMessage,
} from "@/lib/image-upload-limits";

export const AVATAR_MAX_BYTES = 150_000;
export const AVATAR_MAX_DIMENSION = 256;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

const DATA_URL_PATTERN =
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export function isAvatarDataUrl(value: string): boolean {
  return DATA_URL_PATTERN.test(value.trim());
}

export async function finalizeAvatarDataUrl(dataUrl: string): Promise<string> {
  const compressed = await compressDataUrlToMaxBytes(dataUrl, AVATAR_MAX_BYTES);
  if (estimateDataUrlBytes(compressed) > AVATAR_MAX_BYTES) {
    throw new Error(
      "Profile image is still too large after compression. Try a smaller photo.",
    );
  }
  return compressed;
}

/** @deprecated Prefer the image crop flow; kept for legacy callers. */
export async function prepareAvatarFile(file: File): Promise<string> {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    throw new Error("Profile image must be a JPEG, PNG, or WebP file.");
  }
  if (file.size > IMAGE_SOURCE_MAX_BYTES) {
    throw new Error(imageSourceTooLargeMessage("Profile image"));
  }

  const dataUrl = await resizeAvatarToDataUrl(file);
  return finalizeAvatarDataUrl(dataUrl);
}

async function resizeAvatarToDataUrl(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  const scale = Math.min(
    1,
    AVATAR_MAX_DIMENSION / Math.max(img.width, img.height),
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

  return canvas.toDataURL("image/jpeg", 0.86);
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
