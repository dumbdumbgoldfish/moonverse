/** Profile banner / background image upload limits and validation. */

import {
  compressDataUrlToMaxBytes,
  estimateDataUrlBytes,
} from "@/lib/image-crop-utils";
import {
  IMAGE_SOURCE_MAX_BYTES,
  imageSourceTooLargeMessage,
} from "@/lib/image-upload-limits";

export const PROFILE_BACKGROUND_MAX_BYTES = 350_000;
export const PROFILE_BACKGROUND_WIDTH = 1200;
export const PROFILE_BACKGROUND_HEIGHT = 400;
export const PROFILE_BACKGROUND_ACCEPT = "image/jpeg,image/png,image/webp";

const DATA_URL_PATTERN =
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export function isProfileBackgroundDataUrl(value: string): boolean {
  return DATA_URL_PATTERN.test(value.trim());
}

export async function finalizeProfileBackgroundDataUrl(
  dataUrl: string,
): Promise<string> {
  const compressed = await compressDataUrlToMaxBytes(
    dataUrl,
    PROFILE_BACKGROUND_MAX_BYTES,
    [0.84, 0.72, 0.6, 0.48],
  );
  if (estimateDataUrlBytes(compressed) > PROFILE_BACKGROUND_MAX_BYTES) {
    throw new Error(
      "Background image is still too large after compression. Try a smaller photo.",
    );
  }
  return compressed;
}

/** @deprecated Prefer the image crop flow; kept for legacy callers. */
export async function prepareProfileBackgroundFile(file: File): Promise<string> {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    throw new Error("Background image must be a JPEG, PNG, or WebP file.");
  }
  if (file.size > IMAGE_SOURCE_MAX_BYTES) {
    throw new Error(imageSourceTooLargeMessage("Background image"));
  }

  const dataUrl = await resizeProfileBackgroundToDataUrl(file);
  return finalizeProfileBackgroundDataUrl(dataUrl);
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

async function resizeProfileBackgroundToDataUrl(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  const targetWidth = PROFILE_BACKGROUND_WIDTH;
  const targetHeight = PROFILE_BACKGROUND_HEIGHT;
  const targetAspect = targetWidth / targetHeight;
  const sourceAspect = img.width / img.height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (sourceAspect > targetAspect) {
    sw = Math.round(img.height * targetAspect);
    sx = Math.round((img.width - sw) / 2);
  } else {
    sh = Math.round(img.width / targetAspect);
    sy = Math.round((img.height - sh) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process that image in this browser.");
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL("image/jpeg", 0.84);
}
