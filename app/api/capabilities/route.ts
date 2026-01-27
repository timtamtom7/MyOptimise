import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getAuthOptions } from "@/lib/auth";
import { getEffectiveCapabilities } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

  const baseCapabilities = getEffectiveCapabilities(acct);
  
  // Fetch Supabase Profile to get the UUID used in user_capabilities
  // This ensures we use the same ID that the "Mixing Board" uses.
  const { data: profile } = await (supabaseAdmin as any)
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  let extraCaps: string[] = [];

  if (profile?.id) {
    // Fetch overrides from Supabase using the Profile UUID
    const { data: userCaps } = await (supabaseAdmin as any)
        .from("user_capabilities")
        .select("capabilities(name)")
        .eq("user_id", profile.id)
        .eq("granted", true);

    extraCaps = userCaps?.flatMap((uc: any) => uc.capabilities?.name ? [uc.capabilities.name] : []) || [];
  }
  
  const capabilities = Array.from(new Set([...baseCapabilities, ...extraCaps])).sort();

  return NextResponse.json({
    ok: true,
    account: { id: String(acct._id), email: String(acct.email || email), name: String(acct.name || ""), type: String(acct.type || "") },
    capabilities,
  });
}
