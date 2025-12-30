import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getAuthOptions, hasAccountCapability } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(getAuthOptions());
  const email = String((session as any)?.user?.email || "");
  if (!email) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || String(acct.status || "") === "disabled") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasAccountCapability(acct, "identity.session.logout_all")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) {
    return NextResponse.json({ ok: false, error: "missing_write_token" }, { status: 503 });
  }

  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  await writeClient.patch(String(acct._id)).setIfMissing({ sessionVersion: 0 }).inc({ sessionVersion: 1 }).commit();

  return NextResponse.json({ ok: true });
}
