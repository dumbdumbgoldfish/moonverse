"use client";

import { useEffect, useState } from "react";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

export function prefersFinePointerHover(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

/** True when the device supports real hover (mouse/trackpad), not touch-primary. */
export function useFinePointer() {
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(FINE_POINTER_QUERY);
    const update = () => setFinePointer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return finePointer;
}

/** Wire desktop-only hover preview; keeps touch scroll from triggering mouseenter handlers. */
export function useHoverPreview(onPreview?: () => void) {
  const finePointer = useFinePointer();

  return {
    onMouseEnter: finePointer && onPreview ? onPreview : undefined,
    onFocus: onPreview,
  };
}
