import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { searchAll } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return ok({ results: [], query: q });
    return ok({ results: searchAll(q, 30), query: q });
  } catch (e) {
    return errorResponse(e);
  }
}
