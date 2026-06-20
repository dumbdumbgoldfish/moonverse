import Link from "next/link";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <MoonieMascot size={80} animated />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Moonie searched the galaxy but couldn&apos;t find that page. It may have
        moved or never existed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button render={<Link href="/" />}>Back to home</Button>
        <Button variant="outline" render={<Link href="/reviews" />}>
          Browse reviews
        </Button>
      </div>
    </div>
  );
}
