"use server";

import { client } from "@/sanity/lib/client";
import { safeGetServerSession } from "@/lib/auth";

export async function createUpsellLead() {
  const session = await safeGetServerSession();
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) throw new Error("Missing write token");
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const account = await client.fetch(`*[_type == "account" && lower(email) == lower($email)][0]`, { email });
  if (!account) throw new Error("Account not found");

  // Create a lead
  await writeClient.create({
    _type: "lead",
    name: account.name,
    email: account.email,
    businessName: account.businessName,
    source: "client_dashboard_upsell",
    status: "new",
    notes: "Client requested upgrade from dashboard.",
    createdAt: new Date().toISOString(),
  });
}
