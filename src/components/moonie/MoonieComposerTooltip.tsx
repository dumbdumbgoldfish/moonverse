"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type MoonieComposerTooltipAlign = "start" | "center" | "end";

type ComposerTooltipRegistry = {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

type TooltipPosition = {
  top: number;
  left: number;
  arrowLeft: number;
};

const ComposerTooltipContext = createContext<ComposerTooltipRegistry | null>(null);

const VIEWPORT_PADDING = 10;
const TOOLTIP_GAP = 8;
const ARROW_SIZE = 10;

function subscribeClientMounted() {
  return () => {};
}

function getClientMountedSnapshot() {
  return true;
}

function getServerMountedSnapshot() {
  return false;
}

function measureMoonieComposerTooltipPosition(
  trigger: HTMLElement,
  tooltip: HTMLElement,
  align: MoonieComposerTooltipAlign
): TooltipPosition {
  const triggerRect = trigger.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  let left =
    align === "end"
      ? triggerRect.right - tooltipRect.width
      : align === "start"
        ? triggerRect.left
        : triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, viewportWidth - tooltipRect.width - VIEWPORT_PADDING)
  );

  const top = Math.max(
    VIEWPORT_PADDING,
    triggerRect.top - tooltipRect.height - TOOLTIP_GAP
  );

  const triggerCenter = triggerRect.left + triggerRect.width / 2;
  const arrowLeft = Math.max(
    ARROW_SIZE,
    Math.min(tooltipRect.width - ARROW_SIZE, triggerCenter - left)
  );

  return { top, left, arrowLeft };
}

export function MoonieComposerTooltipProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <ComposerTooltipContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </ComposerTooltipContext.Provider>
  );
}

function MoonieComposerTooltipBubble({
  triggerRef,
  label,
  hint,
  align,
}: {
  triggerRef: RefObject<HTMLDivElement | null>;
  label: string;
  hint?: string;
  align: MoonieComposerTooltipAlign;
}) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const assignTooltipNode = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      const measure = () => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        setPosition(measureMoonieComposerTooltipPosition(trigger, node, align));
      };

      measure();

      const onReposition = () => {
        measure();
      };

      window.addEventListener("resize", onReposition);
      window.addEventListener("scroll", onReposition, true);

      const observer =
        typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onReposition);
      observer?.observe(node);
      const trigger = triggerRef.current;
      if (trigger) observer?.observe(trigger);

      return () => {
        window.removeEventListener("resize", onReposition);
        window.removeEventListener("scroll", onReposition, true);
        observer?.disconnect();
      };
    },
    [align, triggerRef]
  );

  const tooltipStyle: CSSProperties | undefined = position
    ? {
        top: position.top,
        left: position.left,
      }
    : {
        top: -9999,
        left: -9999,
        visibility: "hidden",
      };

  return (
    <div
      ref={assignTooltipNode}
      role="tooltip"
      style={tooltipStyle}
      className={cn(
        "pointer-events-none fixed z-[120] w-max max-w-[min(16rem,calc(100vw-1.25rem))]",
        "transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
        position ? "opacity-100 translate-y-0" : "opacity-0"
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#C89B4A]/30 bg-gradient-to-br from-[#FFFBFF] via-[#F8F2FF] to-[#FFF8E8] px-3 py-1.5 shadow-[0_14px_32px_-14px_rgba(76,42,103,0.4)] ring-1 ring-violet-100/90">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B4A]/70 to-transparent"
        />
        <p className="whitespace-nowrap bg-gradient-to-r from-[#C89B4A] via-[#9B6FD6] to-[#6E46C7] bg-clip-text text-center text-[11px] font-bold leading-tight text-transparent">
          {label}
        </p>
        {hint ? (
          <p className="mt-0.5 whitespace-nowrap text-center text-[10px] leading-snug text-slate-600">
            {hint}
          </p>
        ) : null}
      </div>
      <div
        aria-hidden
        style={{ left: position?.arrowLeft ?? 16 }}
        className="absolute -bottom-[5px] size-2.5 -translate-x-1/2 rotate-45 border-b border-r border-[#C89B4A]/30 bg-[#F8F2FF]"
      />
    </div>
  );
}

export function MoonieComposerTooltip({
  label,
  hint,
  align = "center",
  id,
  children,
}: {
  label: string;
  hint?: string;
  align?: MoonieComposerTooltipAlign;
  id?: string;
  children: ReactElement;
}) {
  const autoId = useId();
  const tooltipId = id ?? autoId;
  const registry = useContext(ComposerTooltipContext);
  const open = registry?.activeId === tooltipId;
  const triggerRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    subscribeClientMounted,
    getClientMountedSnapshot,
    getServerMountedSnapshot
  );

  function show() {
    registry?.setActiveId(tooltipId);
  }

  function hide() {
    if (registry?.activeId === tooltipId) {
      registry.setActiveId(null);
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="relative flex"
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocusCapture={show}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            hide();
          }
        }}
      >
        {children}
      </div>
      {open && mounted
        ? createPortal(
            <MoonieComposerTooltipBubble
              triggerRef={triggerRef}
              label={label}
              hint={hint}
              align={align}
            />,
            document.body
          )
        : null}
    </>
  );
}
