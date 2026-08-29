import Link from "next/link";

const primaryLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Sign up" },
];

const secondaryLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/help", label: "Help" },
];

export function AuthFooter() {
  return (
    <footer className="relative z-10 border-t border-black/5 bg-white px-4 py-8 text-center sm:px-8">
      <nav aria-label="Auth footer">
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[#555]">
          {primaryLinks.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="hover:text-[#1a1a1a] hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[#555]">
          {secondaryLinks.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="hover:text-[#1a1a1a] hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-4 text-xs text-[#888]">
        © {new Date().getFullYear()} MoonVerse · Discover · Read · Connect
      </p>
    </footer>
  );
}
