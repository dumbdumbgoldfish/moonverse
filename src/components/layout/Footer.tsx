import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const footerLinks = {
  Explore: [
    { href: "/reviews", label: "Browse Reviews" },
    { href: "/reviews/new", label: "Write a Review" },
    { href: "/demo", label: "Demo Guide" },
    { href: "/about", label: "About MoonVerse" },
  ],
  Account: [
    { href: "/login", label: "Log in" },
    { href: "/register", label: "Sign up" },
    { href: "/settings", label: "Settings" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-bg-warm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="sm" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              A community platform for web novel reviews. Discover stories, share
              your thoughts, and let Moonie guide your next read.
            </p>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-foreground">MoonVerse</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              MSc Project · UK University
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              © {new Date().getFullYear()} MoonVerse. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
