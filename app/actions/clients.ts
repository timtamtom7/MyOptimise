"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "next-sanity";
import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-18",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

export async function updateClientScope(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) throw new Error("Unauthorized");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) throw new Error("Unauthorized");
  
  // Allow admins and managers to update scope
  if (acct.type !== "admin" && acct.type !== "manager") {
    throw new Error("Insufficient permissions");
  }

  const clientId = String(formData.get("clientId"));
  const scope = String(formData.get("scope"));

  if (!clientId || !scope) throw new Error("Missing required fields");

  await client.patch(clientId).set({ serviceScope: scope }).commit();

  revalidatePath(`/dashboard/business/${clientId}`);
}
