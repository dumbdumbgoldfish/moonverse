import type { NextConfig } from "next";

const isolatedDistDir = process.env.NEXT_MOONVERSE_DIST_DIR?.trim();

const nextConfig: NextConfig = {
  ...(isolatedDistDir ? { distDir: isolatedDistDir } : {}),
  // Keep Prisma out of Turbopack SSR bundles so `prisma generate` is picked up
  // without a stale inlined DMMF after schema changes.
  serverExternalPackages: ["@prisma/client", "prisma", "resend", "@react-email/render"],
  experimental: {
    optimizePackageImports: ["@base-ui/react", "lucide-react"],
  },
  devIndicators: false,
  images: {
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 168, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/id/**",
      },
      {
        protocol: "https",
        hostname: "cdn.wuxiaworld.com",
        pathname: "/images/covers/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "www.royalroadcdn.com",
        pathname: "/public/**",
      },
      {
        protocol: "https",
        hostname: "royalroadcdn.com",
        pathname: "/public/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
