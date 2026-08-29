/** SVG gradient defs for admin Lucide icons (gold · white · purple). */
export function AdminIconGradients() {
  return (
    <svg aria-hidden className="pointer-events-none absolute size-0 overflow-hidden">
      <defs>
        <linearGradient id="mv-admin-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="48%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
        <linearGradient id="mv-admin-icon-gradient-on-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
