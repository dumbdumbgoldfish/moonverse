"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ImageCropPreset } from "@/lib/image-crop-presets";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  preset: ImageCropPreset;
  onCancel: () => void;
  onConfirm: (croppedAreaPixels: Area) => void | Promise<void>;
  isProcessing?: boolean;
  error?: string | null;
}

export function ImageCropDialog({
  open,
  imageSrc,
  preset,
  onCancel,
  onConfirm,
  isProcessing = false,
  error = null,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (open && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open, imageSrc]);

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isProcessing) {
        onCancel();
      }
    },
    [isProcessing, onCancel],
  );

  const handleConfirm = useCallback(() => {
    if (!croppedAreaPixels || isProcessing) return;
    void onConfirm(croppedAreaPixels);
  }, [croppedAreaPixels, isProcessing, onConfirm]);

  const adjustZoom = useCallback((delta: number) => {
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))),
    );
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isProcessing}
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogHeader className="gap-1 border-b px-4 py-4 pr-12">
          <DialogTitle>{preset.title}</DialogTitle>
          <DialogDescription>{preset.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-xl bg-[#1A1224]/5 ring-1 ring-[#1A1224]/10",
              preset.aspect >= 1 ? "h-[min(52vh,22rem)]" : "h-[min(60vh,26rem)]",
            )}
          >
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={preset.aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                objectFit="contain"
                showGrid
                classes={{
                  containerClassName: "rounded-xl",
                  cropAreaClassName: "!border-2 !border-white/90 !shadow-[0_0_0_9999px_rgba(26,18,36,0.45)]",
                }}
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">Zoom</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => adjustZoom(-ZOOM_STEP * 4)}
                  disabled={isProcessing || zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                >
                  <Minus aria-hidden />
                </Button>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  disabled={isProcessing}
                  className="h-2 w-full min-w-[8rem] cursor-pointer accent-[#6E46C7]"
                  aria-label="Zoom level"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => adjustZoom(ZOOM_STEP * 4)}
                  disabled={isProcessing || zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                >
                  <Plus aria-hidden />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Drag the image to reposition it inside the frame. What you see is what will be saved.
            </p>
          </div>

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="sticky bottom-0 border-t bg-popover px-4 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              preset.confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
