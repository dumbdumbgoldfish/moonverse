"use client";

import { useId, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import { Loader2, Trash2, Upload } from "lucide-react";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useImageCropFlow } from "@/hooks/use-image-crop-flow";
import { AVATAR_ACCEPT } from "@/lib/avatar-upload";
import { formatImageMaxMegabytes } from "@/lib/image-upload-limits";
import { getInitials } from "@/lib/review-utils";
import { cn } from "@/lib/utils";

interface ProfileImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  displayName: string;
  disabled?: boolean;
}

export function ProfileImageUpload({
  value,
  onChange,
  displayName,
  disabled = false,
}: ProfileImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cropFlow = useImageCropFlow("avatar");
  const preview = value.trim() || null;
  const initials = getInitials(displayName);

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
        err instanceof Error ? err.message : "Could not upload profile image.",
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
      <Label htmlFor={inputId}>Profile image</Label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={AVATAR_ACCEPT}
        disabled={disabled || isProcessing || cropFlow.isOpen}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={disabled || isProcessing || cropFlow.isOpen}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-2",
            (disabled || isProcessing || cropFlow.isOpen) &&
              "cursor-not-allowed opacity-60",
          )}
          aria-label={preview ? "Replace profile image" : "Upload profile image"}
        >
          <Avatar className="size-20 ring-2 ring-[#1A1224]/8 transition group-hover:ring-[#6E46C7]/30">
            {preview ? <AvatarImage src={preview} alt="" /> : null}
            <AvatarFallback className="bg-primary/20 text-lg text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[#1A1224]/0 transition group-hover:bg-[#1A1224]/35">
            {isProcessing ? (
              <Loader2
                className="size-5 animate-spin text-white opacity-0 group-hover:opacity-100"
                aria-hidden
              />
            ) : (
              <Upload
                className="size-5 text-white opacity-0 group-hover:opacity-100"
                aria-hidden
              />
            )}
          </span>
        </button>

        <div className="min-w-0 space-y-2">
          <p className="text-sm text-muted-foreground">
            Upload a square photo. JPEG, PNG, or WebP · max{" "}
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
              {preview ? "Replace image" : "Upload profile image"}
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
