"use server";

import { client } from "@/sanity/lib/client";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch"; // We can't use this with ID easily, better use fetch
import { ROLE_CAPABILITIES, UserCapabilities } from "@/lib/capabilities";
import { revalidatePath } from "next/cache";
import { safeGetServerSession } from "@/lib/auth";

export async function toggleCapability(userId: string, capabilityId: string, granted: boolean) {
  const session = await safeGetServerSession();
  if (!session) throw new Error("Unauthorized");

  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) throw new Error("Missing write token");

  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  // 1. Fetch user to get current arrays and role
  const user = await writeClient.fetch(`*[_type == "account" && _id == $id][0]`, { id: userId });
  if (!user) throw new Error("User not found");

  const role = user.type || "employee";
  const baseCaps = ROLE_CAPABILITIES[role as keyof typeof ROLE_CAPABILITIES] || {};
  const baseValue = !!baseCaps[capabilityId as keyof UserCapabilities];

  let newCapabilities = Array.isArray(user.capabilities) ? [...user.capabilities] : [];
  let newRevoked = Array.isArray(user.revokedCapabilities) ? [...user.revokedCapabilities] : [];

  // Remove existing overrides for this capability
  newCapabilities = newCapabilities.filter(c => c !== capabilityId);
  newRevoked = newRevoked.filter(c => c !== capabilityId);

  // Apply new state
  if (granted !== baseValue) {
    if (granted) {
      // Granting something that is base-false
      newCapabilities.push(capabilityId);
    } else {
      // Revoking something that is base-true
      newRevoked.push(capabilityId);
    }
  }
  // If granted === baseValue, we do nothing (already cleared above), effectively resetting to default.

  // 2. Patch
  await writeClient.patch(userId).set({
    capabilities: newCapabilities,
    revokedCapabilities: newRevoked
  }).commit();

  revalidatePath("/dashboard/admin/permissions");
}
