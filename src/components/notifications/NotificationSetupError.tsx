import Link from "next/link";
import { SITE_PAGE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NotificationSetupErrorProps {
  message?: string;
}

export function NotificationSetupError({
  message,
}: NotificationSetupErrorProps) {
  return (
    <div className={cn(SITE_PAGE_SHELL_CLASS, "py-16")}>
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <h1 className="font-serif text-2xl font-bold text-[#1A1224]">
          Inbox needs a quick setup step
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#1A1224]/75">
          {message ??
            "Your database is missing the latest notifications fields. Run the migration, then restart the dev server."}
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-white px-4 py-3 text-left text-xs text-[#1A1224]/80 ring-1 ring-amber-100">
          npx prisma migrate deploy{"\n"}npm run dev
        </pre>
        <Button className="mt-5" size="sm" render={<Link href="/home" />}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
