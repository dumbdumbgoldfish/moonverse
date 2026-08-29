"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import {
  finalizeCroppedDataUrl,
  IMAGE_CROP_PRESETS,
  type ImageCropPreset,
  type ImageCropPresetId,
} from "@/lib/image-crop-presets";
import { getCroppedImageDataUrl } from "@/lib/image-crop-utils";

export function useImageCropFlow(presetId: ImageCropPresetId) {
  const preset = IMAGE_CROP_PRESETS[presetId];
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokeBlob(), [revokeBlob]);

  const openWithFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        setError(preset.invalidTypeMessage);
        return;
      }
      if (file.size > preset.maxSourceBytes) {
        setError(preset.tooLargeMessage);
        return;
      }
      revokeBlob();
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      setImageSrc(url);
    },
    [preset, revokeBlob],
  );

  const cancel = useCallback(() => {
    revokeBlob();
    setImageSrc(null);
    setError(null);
  }, [revokeBlob]);

  const confirmCrop = useCallback(
    async (croppedAreaPixels: Area): Promise<string | null> => {
      if (!imageSrc) return null;
      setError(null);
      try {
        const raw = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels, {
          width: preset.outputWidth,
          height: preset.outputHeight,
        });
        const finalized = await finalizeCroppedDataUrl(presetId, raw);
        revokeBlob();
        setImageSrc(null);
        return finalized;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not process that image.",
        );
        return null;
      }
    },
    [imageSrc, preset, presetId, revokeBlob],
  );

  return {
    preset: preset as ImageCropPreset,
    isOpen: Boolean(imageSrc),
    imageSrc,
    error,
    setError,
    openWithFile,
    cancel,
    confirmCrop,
  };
}
