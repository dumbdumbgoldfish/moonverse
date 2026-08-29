import {
  MOONIE_IMAGE_MAX_BYTES,
  moonieImageTooLargeMessage,
} from "@/lib/image-upload-limits";

export { MOONIE_IMAGE_MAX_BYTES };

export const MOONIE_ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type MoonieImageValidationResult =
  | { ok: true; mimeType: string }
  | { ok: false; reason: string };

export function normalizeImageMimeType(
  mimeType: string | undefined,
  fileName?: string
): string {
  const normalized = mimeType?.toLowerCase().trim() ?? "";
  if (MOONIE_ALLOWED_IMAGE_MIME.has(normalized)) return normalized;

  const lowerName = fileName?.toLowerCase() ?? "";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".webp")) return "image/webp";
  if (lowerName.endsWith(".gif")) return "image/gif";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return normalized || "image/png";
}

export function validateImageFile(file: File): MoonieImageValidationResult {
  if (!file || file.size === 0) {
    return { ok: false, reason: "The clipboard image is empty." };
  }

  if (file.size > MOONIE_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      reason: moonieImageTooLargeMessage(),
    };
  }

  const mimeType = normalizeImageMimeType(file.type, file.name);
  if (!MOONIE_ALLOWED_IMAGE_MIME.has(mimeType)) {
    return {
      ok: false,
      reason: "Unsupported image type. Use JPEG, PNG, WebP, or GIF.",
    };
  }

  return { ok: true, mimeType };
}

export function validateImageBase64(options: {
  base64: string;
  mimeType?: string;
}): MoonieImageValidationResult {
  if (!options.base64.trim()) {
    return { ok: false, reason: "No image data was provided." };
  }

  let payload = options.base64.trim();
  if (payload.includes(",")) {
    payload = payload.split(",").pop() ?? payload;
  }

  const byteLength = Math.floor((payload.length * 3) / 4);
  if (byteLength > MOONIE_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      reason: moonieImageTooLargeMessage(),
    };
  }

  const mimeType = normalizeImageMimeType(options.mimeType);
  if (!MOONIE_ALLOWED_IMAGE_MIME.has(mimeType)) {
    return {
      ok: false,
      reason: "Unsupported image type. Use JPEG, PNG, WebP, or GIF.",
    };
  }

  return { ok: true, mimeType };
}

export async function readImageFileAsPayload(file: File): Promise<{
  data: string;
  mimeType: string;
  previewUrl: string;
  fileName: string;
}> {
  const validation = validateImageFile(file);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

  const normalized = await normalizeWebpImageForVision(dataUrl, validation.mimeType);
  const base64 = normalized.dataUrl.includes(",")
    ? normalized.dataUrl.split(",")[1] ?? ""
    : normalized.dataUrl;
  if (!base64) {
    throw new Error("Could not convert image for upload.");
  }

  return {
    data: base64,
    mimeType: normalized.mimeType,
    previewUrl: normalized.dataUrl,
    fileName: file.name || "pasted-image.png",
  };
}

async function normalizeWebpImageForVision(
  dataUrl: string,
  mimeType: string
): Promise<{ dataUrl: string; mimeType: string }> {
  if (mimeType !== "image/webp" || typeof document === "undefined") {
    return { dataUrl, mimeType };
  }

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode WebP image."));
      element.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context || canvas.width === 0 || canvas.height === 0) {
      return { dataUrl, mimeType };
    }

    context.drawImage(image, 0, 0);
    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.92),
      mimeType: "image/jpeg",
    };
  } catch {
    return { dataUrl, mimeType };
  }
}

export function clipboardImageFile(
  clipboardData: DataTransfer | null
): File | null {
  if (!clipboardData?.items?.length) return null;

  for (const item of Array.from(clipboardData.items)) {
    if (!item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) return file;
  }

  return null;
}

export function clipboardHasText(clipboardData: DataTransfer | null): boolean {
  if (!clipboardData) return false;
  const plain = clipboardData.getData("text/plain")?.trim();
  if (plain) return true;
  return Array.from(clipboardData.items).some(
    (item) => item.kind === "string" && item.type === "text/plain"
  );
}

export function defaultPastedImageFileName(mimeType: string): string {
  if (mimeType === "image/jpeg") return "pasted-screenshot.jpg";
  if (mimeType === "image/webp") return "pasted-screenshot.webp";
  if (mimeType === "image/gif") return "pasted-screenshot.gif";
  return "pasted-screenshot.png";
}
