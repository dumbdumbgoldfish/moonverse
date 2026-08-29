import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { auth } from "@/lib/auth";
import { getMetadataBase } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "MoonVerse · Web Novel Review Community",
  description:
    "Discover, share and discuss web novel reviews. Let Moonie recommend your next read.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <SessionProvider session={session}>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
