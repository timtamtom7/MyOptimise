"use server";

import { client } from "@/sanity/lib/client";
import { safeGetServerSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createConnection(clientId: string, platform: string, accessToken: string, pageId: string, pageName: string) {
  const session = await safeGetServerSession();
  if (!session) throw new Error("Unauthorized");

  // TODO: Add stricter permission checks (is admin/manager OR is the client themselves)

  const writeClient = client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN });

  // Check if connection already exists for this platform + client
  const existing = await writeClient.fetch(
    `*[_type == "socialConnection" && client._ref == $clientId && platform == $platform][0]._id`,
    { clientId, platform }
  );

  if (existing) {
    await writeClient
      .patch(existing)
      .set({
        accessToken,
        pageId,
        pageName,
        status: "active",
        updatedAt: new Date().toISOString(),
      })
      .commit();
  } else {
    await writeClient.create({
      _type: "socialConnection",
      client: { _type: "reference", _ref: clientId },
      platform,
      accessToken,
      pageId,
      pageName,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  }

  revalidatePath("/dashboard/client");
  revalidatePath(`/dashboard/business/${clientId}`);
}

export async function disconnectConnection(id: string) {
  const session = await safeGetServerSession();
  if (!session) throw new Error("Unauthorized");

  const writeClient = client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN });
  
  await writeClient
    .patch(id)
    .set({ status: "disconnected" })
    .commit();

  revalidatePath("/dashboard/client");
}
