/** Shared helpers for client-side image cropping and compression. */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOutputSize {
  width: number;
  height: number;
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image file."));
    img.src = src;
  });
}

export async function getCroppedImageDataUrl(
  imageSrc: string,
  pixelCrop: PixelCrop,
  output: CropOutputSize,
  options?: { mime?: "image/jpeg" | "image/png" | "image/webp"; quality?: number },
): Promise<string> {
  const image = await loadImageElement(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process that image in this browser.");
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    output.width,
    output.height,
  );

  const mime = options?.mime ?? "image/jpeg";
  const quality = options?.quality ?? 0.86;
  return canvas.toDataURL(mime, quality);
}

export function compressCanvasToMaxBytes(
  canvas: HTMLCanvasElement,
  maxBytes: number,
  mime: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  qualities: number[] = [0.86, 0.72, 0.58, 0.45],
): string {
  let dataUrl = canvas.toDataURL(mime, mime === "image/jpeg" ? qualities[0] : undefined);
  if (mime !== "image/jpeg" || estimateDataUrlBytes(dataUrl) <= maxBytes) {
    if (estimateDataUrlBytes(dataUrl) <= maxBytes) return dataUrl;
    if (mime !== "image/jpeg") {
      dataUrl = canvas.toDataURL("image/jpeg", qualities[0]);
    }
  }

  for (const quality of qualities) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (estimateDataUrlBytes(dataUrl) <= maxBytes) return dataUrl;
  }

  return dataUrl;
}

export async function compressDataUrlToMaxBytes(
  dataUrl: string,
  maxBytes: number,
  qualities: number[] = [0.86, 0.72, 0.58, 0.45],
): Promise<string> {
  const image = await loadImageElement(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process that image in this browser.");
  }
  ctx.drawImage(image, 0, 0);
  return compressCanvasToMaxBytes(canvas, maxBytes, "image/jpeg", qualities);
}
