"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MoonieVoiceDictationState } from "@/hooks/use-moonie-voice-dictation";

const SILENCE_DISPLAY_LEVEL = 0.1;

function resampleLevels(levels: number[], targetCount: number): number[] {
  if (targetCount <= 0) return [];
  if (levels.length === 0) {
    return Array.from({ length: targetCount }, () => 0);
  }
  if (levels.length === 1) {
    return Array.from({ length: targetCount }, () => levels[0] ?? 0);
  }

  return Array.from({ length: targetCount }, (_, index) => {
    const position = (index / (targetCount - 1)) * (levels.length - 1);
    const left = Math.floor(position);
    const right = Math.min(levels.length - 1, left + 1);
    const fraction = position - left;
    const leftLevel = levels[left] ?? 0;
    const rightLevel = levels[right] ?? 0;
    return leftLevel + (rightLevel - leftLevel) * fraction;
  });
}

function toDisplayLevel(level: number): number {
  if (level <= 0.02) {
    return SILENCE_DISPLAY_LEVEL;
  }

  return SILENCE_DISPLAY_LEVEL + Math.min(1, level) * (1 - SILENCE_DISPLAY_LEVEL);
}

function softenLevels(levels: number[]): number[] {
  return levels.map((level, index) => {
    const previous = levels[index - 1] ?? level;
    const next = levels[index + 1] ?? level;
    return previous * 0.08 + level * 0.84 + next * 0.08;
  });
}

function levelToHalfHeight(displayLevel: number, drawHeight: number): number {
  const silentHalf = Math.max(1.1, drawHeight * 0.055);
  const maxHalf = drawHeight * 0.46;
  const speechRange =
    (displayLevel - SILENCE_DISPLAY_LEVEL) / (1 - SILENCE_DISPLAY_LEVEL);
  const scaled = Math.pow(Math.max(0, Math.min(1, speechRange)), 0.76);
  return silentHalf + scaled * (maxHalf - silentHalf);
}

function barOpacity(displayLevel: number): number {
  const speechRange =
    (displayLevel - SILENCE_DISPLAY_LEVEL) / (1 - SILENCE_DISPLAY_LEVEL);
  if (speechRange <= 0.02) {
    return 0.34;
  }
  return 0.42 + Math.min(1, speechRange) * 0.46;
}

function MoonieVoiceWaveform({ levels }: { levels: number[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const draw = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const horizontalPadding = 1;
      const verticalPadding = 1;
      const drawWidth = Math.max(0, width - horizontalPadding * 2);
      const drawHeight = Math.max(0, height - verticalPadding * 2);

      if (drawWidth <= 0 || drawHeight <= 0 || levels.length === 0) return;

      const lineWidth = 1;
      const columnStep = 2.3;
      const barCount = Math.max(1, Math.floor(drawWidth / columnStep));
      const resampled = resampleLevels(levels, barCount);
      const visibleLevels = softenLevels(
        resampled.map((level) => toDisplayLevel(level))
      );
      const offsetX = horizontalPadding;
      const centerY = verticalPadding + drawHeight / 2;

      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      for (let index = 0; index < barCount; index += 1) {
        const displayLevel = visibleLevels[index] ?? SILENCE_DISPLAY_LEVEL;
        const half = levelToHalfHeight(displayLevel, drawHeight);
        const x = offsetX + index * columnStep + columnStep / 2;
        const opacity = barOpacity(displayLevel);

        ctx.strokeStyle = `rgba(110, 70, 199, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(x, centerY - half);
        ctx.lineTo(x, centerY + half);
        ctx.stroke();
      }
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [levels]);

  return (
    <div ref={containerRef} className="h-full w-full" aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export function MoonieVoiceRecordingBar({
  state,
  elapsedLabel,
  waveformLevels,
  onStop,
  onCancel,
  onSend,
  variant = "default",
}: {
  state: Extract<MoonieVoiceDictationState, "listening" | "transcribing">;
  elapsedLabel: string;
  waveformLevels: number[];
  waveformVisibleCount?: number;
  onStop: () => void;
  onCancel: () => void;
  onSend?: () => void;
  variant?: "default" | "widget";
}) {
  const isListening = state === "listening";
  const isWidget = variant === "widget";

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1 rounded-full border border-violet-100 bg-white px-1.5 py-1 shadow-sm ring-1 ring-violet-50",
        isWidget ? "gap-1" : "gap-1.5"
      )}
      role="status"
      aria-live="polite"
      aria-label={isListening ? "Listening for dictation" : "Transcribing dictation"}
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel dictation"
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#6E46C7] transition hover:bg-violet-50"
      >
        <X className="size-3.5" aria-hidden />
      </button>

      <div className="relative min-w-0 flex-1">
        {isListening ? (
          <>
            <div className="h-5 w-full pr-8">
              <MoonieVoiceWaveform levels={waveformLevels} />
            </div>
            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[10px] font-medium tabular-nums text-slate-400">
              {elapsedLabel}
            </span>
          </>
        ) : (
          <div className="flex h-5 items-center justify-center">
            <span className="text-[10px] font-medium text-[#6E46C7]/80">
              Transcribing…
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onStop}
        disabled={!isListening}
        aria-label={isListening ? "Stop dictation" : "Transcribing"}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white text-[#6E46C7] transition hover:bg-violet-50 disabled:cursor-default",
          !isListening && "opacity-70"
        )}
      >
        {isListening ? (
          <Square className="size-3 fill-current" aria-hidden />
        ) : (
          <span
            className="size-2 animate-pulse rounded-full bg-[#6E46C7]"
            aria-hidden
          />
        )}
      </button>

      <button
        type="button"
        onClick={onSend ?? onStop}
        disabled={!isListening}
        aria-label="Finish and use dictation"
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6E46C7] to-[#8B6FD6] text-white shadow-sm transition hover:from-[#5a3aa8] hover:to-[#7a5fc8] disabled:cursor-default disabled:opacity-60"
      >
        <ArrowUp className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
