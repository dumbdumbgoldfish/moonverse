"use client";

import { useId, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useImageCropFlow } from "@/hooks/use-image-crop-flow";
import { NOVEL_COVER_ACCEPT } from "@/lib/novel-cover";
import { formatImageMaxMegabytes } from "@/lib/image-upload-limits";
import { cn } from "@/lib/utils";

interface CoverImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CoverImageUpload({
  value,
  onChange,
  disabled = false,
  className,
}: CoverImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cropFlow = useImageCropFlow("novelCover");

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
      setError(err instanceof Error ? err.message : "Could not upload cover.");
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
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId} className="inline-flex items-center gap-1.5">
        <ImageIcon className="size-3.5 text-[var(--mv-plum)]" aria-hidden />
        Cover image
        <span className="font-normal text-[var(--mv-text-muted)]">(optional)</span>
      </Label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={NOVEL_COVER_ACCEPT}
        disabled={disabled || isProcessing || cropFlow.isOpen}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      {value ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isProcessing || cropFlow.isOpen}
            className="min-h-10 rounded-xl border-[var(--mv-border)]"
          >
            {isProcessing ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="mr-1.5 size-4" aria-hidden />
            )}
            Replace cover
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            disabled={disabled || isProcessing || cropFlow.isOpen}
            className="min-h-10 rounded-xl text-[var(--mv-text-muted)] hover:text-destructive"
          >
            <Trash2 className="mr-1.5 size-4" aria-hidden />
            Remove
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isProcessing || cropFlow.isOpen}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex min-h-[7.5rem] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--mv-border)] bg-[var(--mv-paper)]/60 px-4 py-5 text-center transition",
            "hover:border-[var(--mv-plum)]/30 hover:bg-[var(--mv-surface-soft)]/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
            (disabled || isProcessing || cropFlow.isOpen) &&
              "cursor-not-allowed opacity-60",
          )}
        >
          {isProcessing ? (
            <Loader2 className="size-6 animate-spin text-[var(--mv-plum)]" aria-hidden />
          ) : (
            <Upload className="size-6 text-[var(--mv-plum)]" aria-hidden />
          )}
          <span className="text-sm font-semibold text-[var(--mv-ink)]">
            {isProcessing ? "Processing image…" : "Upload cover image"}
          </span>
          <span className="text-xs text-[var(--mv-text-muted)]">
            JPEG, PNG, or WebP · max {formatImageMaxMegabytes()}
          </span>
        </button>
      )}

      {displayError ? (
        <p className="text-xs text-destructive" role="alert">
          {displayError}
        </p>
      ) : (
        <p className="text-xs text-[var(--mv-text-muted)]">
          Portrait covers work best. You can crop and reposition after selecting a file.
        </p>
      )}

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
