import Link from "next/link";

export function AuthTrustRow() {
  return (
    <p className="text-center text-xs leading-5 text-[#1A1224]/50">
      13+ · Email stays private · Taste is yours.{" "}
      <Link
        href="/privacy"
        className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
      >
        Privacy
      </Link>
      {" · "}
      <Link
        href="/terms"
        className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
      >
        Terms
      </Link>
    </p>
  );
}
