import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { adminGlobalSearch } from "@/services/admin/search.service";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const results = await adminGlobalSearch(q);
  return NextResponse.json({ results });
}
