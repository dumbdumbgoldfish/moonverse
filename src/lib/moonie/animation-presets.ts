import type { TargetAndTransition, Transition } from "framer-motion";
import type { MoonieAnimationState } from "@/lib/moonie/animation-states";

export interface MoonieMotionPreset {
  animate: TargetAndTransition;
  transition: Transition;
}

/** Framer Motion keyframes per animation state. PNG art stays static; body moves. */
export const MOONIE_MOTION_PRESETS: Record<MoonieAnimationState, MoonieMotionPreset> =
  {
    idle: {
      animate: { y: [0, -4, 0], scale: [1, 1.02, 1], rotate: [0, 0.4, 0, -0.4, 0] },
      transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
    },
    greeting: {
      animate: { y: [0, -6, 0], rotate: [0, 4, -2, 3, 0] },
      transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
    },
    thinking: {
      animate: { y: [0, -2, 0], rotate: [0, -3, 3, -2, 0] },
      transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
    },
    reading: {
      animate: { y: [0, -3, 0], scale: [1, 1.01, 1] },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
    recommendation: {
      animate: { y: [0, -8, -4, -8, 0], scale: [1, 1.03, 1.02, 1.03, 1] },
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
    excited: {
      animate: { y: [0, -14, 0, -10, 0], rotate: [0, -2, 2, 0] },
      transition: { duration: 1.6, repeat: Infinity, ease: "easeOut" },
    },
    celebration: {
      animate: {
        y: [0, -12, 0],
        rotate: [0, -6, 6, -4, 4, 0],
        scale: [1, 1.05, 1],
      },
      transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
    },
    sleeping: {
      animate: { y: [0, -2, 0], scale: [1, 1.015, 1] },
      transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
    },
    typing: {
      animate: { y: [0, -2, 0], rotate: [0, 2, -1, 0] },
      transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
    },
    loading: {
      animate: { y: [0, -4, 0], rotate: [0, 1, -1, 0] },
      transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
    },
    error: {
      animate: { x: [0, -3, 3, -2, 2, 0], rotate: [0, -2, 2, 0] },
      transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
    },
    empty: {
      animate: { rotate: [0, -5, 5, -3, 3, 0], y: [0, -3, 0] },
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
    },
  };
