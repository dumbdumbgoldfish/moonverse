import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ForbiddenMessageProps {
  title?: string;
  message: string;
  returnHref?: string;
  returnLabel?: string;
}

export function ForbiddenMessage({
  title = "Access denied",
  message,
  returnHref = "/",
  returnLabel = "Go home",
}: ForbiddenMessageProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert size={28} aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>
      <Button className="mt-6" render={<Link href={returnHref} />}>
        {returnLabel}
      </Button>
    </div>
  );
}
