import Link from "next/link";
import { FloatingMoonie } from "@/components/brand/FloatingMoonie";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center overflow-visible px-4 py-16 text-center">
      <FloatingMoonie context="notFound" size={120} />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Moonie searched the galaxy but couldn&apos;t find that page. It may have
        moved or never existed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          className="mv-nav-signup rounded-full border-0 px-6 font-bold text-white"
          render={<Link href="/" />}
        >
          Back to home
        </Button>
        <Button
          variant="outline"
          className="mv-nav-login rounded-full font-bold"
          render={<Link href="/discover" />}
        >
          Browse reviews
        </Button>
      </div>
    </div>
  );
}
