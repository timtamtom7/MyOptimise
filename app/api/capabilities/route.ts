import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getAuthOptions } from "@/lib/auth";
import { getEffectiveCapabilities } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  const email = String((session as any)?.user?.email || "");
  if (!email) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || String(acct.status || "") === "disabled") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const capabilities = Array.from(getEffectiveCapabilities(acct)).sort();
  return NextResponse.json({
    ok: true,
    account: { id: String(acct._id), email: String(acct.email || email), name: String(acct.name || ""), type: String(acct.type || "") },
    capabilities,
  });
}
