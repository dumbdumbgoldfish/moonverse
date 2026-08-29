"use client";

import { useId, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import { Loader2, Trash2, Upload } from "lucide-react";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useImageCropFlow } from "@/hooks/use-image-crop-flow";
import { PROFILE_BACKGROUND_ACCEPT } from "@/lib/profile-background-upload";
import { formatImageMaxMegabytes } from "@/lib/image-upload-limits";
import { cn } from "@/lib/utils";

interface ProfileBackgroundUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ProfileBackgroundUpload({
  value,
  onChange,
  disabled = false,
}: ProfileBackgroundUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cropFlow = useImageCropFlow("profileBanner");
  const preview = value.trim() || null;

  function handleFile(file: File | null) {
    if (!file || disabled) return;
    setError(null);
    cropFlow.openWithFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleCropConfirm(croppedAreaPixels: Area) {
    setIsProcessing(true);
    setError(null);
    try {
      const dataUrl = await cropFlow.confirmCrop(croppedAreaPixels);
      if (dataUrl) onChange(dataUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload background image.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCropCancel() {
    cropFlow.cancel();
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    setError(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayError = error ?? cropFlow.error;

  return (
    <div className="space-y-3">
      <Label htmlFor={inputId}>Profile background</Label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={PROFILE_BACKGROUND_ACCEPT}
        disabled={disabled || isProcessing || cropFlow.isOpen}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        disabled={disabled || isProcessing || cropFlow.isOpen}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative block w-full overflow-hidden rounded-2xl border border-[#1A1224]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-2",
          (disabled || isProcessing || cropFlow.isOpen) &&
            "cursor-not-allowed opacity-60",
        )}
        aria-label={preview ? "Replace profile background" : "Upload profile background"}
      >
        <div
          className={cn(
            "aspect-[3/1] w-full bg-cover bg-center",
            !preview && "gradient-profile-cover",
          )}
          style={preview ? { backgroundImage: `url(${preview})` } : undefined}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-[#1A1224]/0 transition group-hover:bg-[#1A1224]/25">
          {isProcessing ? (
            <Loader2
              className="size-6 animate-spin text-white opacity-0 group-hover:opacity-100"
              aria-hidden
            />
          ) : (
            <Upload
              className="size-6 text-white opacity-0 group-hover:opacity-100"
              aria-hidden
            />
          )}
        </span>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Wide banner for your profile page. JPEG, PNG, or WebP · max{" "}
          {formatImageMaxMegabytes()}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isProcessing || cropFlow.isOpen}
          >
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Upload data-icon="inline-start" aria-hidden />
            )}
            {preview ? "Replace background" : "Upload background"}
          </Button>
          {preview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || isProcessing || cropFlow.isOpen}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 data-icon="inline-start" aria-hidden />
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {displayError ? (
        <p className="text-xs text-destructive" role="alert">
          {displayError}
        </p>
      ) : null}

      <ImageCropDialog
        open={cropFlow.isOpen}
        imageSrc={cropFlow.imageSrc}
        preset={cropFlow.preset}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
        isProcessing={isProcessing}
        error={cropFlow.error}
      />
    </div>
  );
}
