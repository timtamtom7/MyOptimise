"use server";

import { safeGetServerSession } from "@/lib/auth";
import { client } from "@/sanity/lib/client";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function updateSelf(formData: FormData) {
  const session = await safeGetServerSession();
  const email = session?.user?.email;
  if (!email) return;

  const account = await fetchSanityAccountByEmail({ email });
  if (!account) return;

  const name = String(formData.get("name") || "").trim();
  const avatarFile = formData.get("avatar") as File | null;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const patch: any = {};
  if (name) patch.name = name;

  if (avatarFile && avatarFile.size > 0) {
     try {
       const asset = await writeClient.assets.upload("image", avatarFile, {
         contentType: avatarFile.type,
         filename: avatarFile.name,
       });
       patch.avatar = { _type: "image", asset: { _type: "reference", _ref: asset._id } };
     } catch (e) {
       console.error("Failed to upload avatar", e);
     }
  }

  if (Object.keys(patch).length > 0) {
    await writeClient.patch(account._id).set(patch).commit();
    await writeAuditLog({
        actorAccountId: account._id,
        action: "account.updated_profile",
        targetId: account._id,
        targetType: "account",
        targetLabel: email,
        context: { name, avatarUpdated: !!avatarFile }
    });
    revalidatePath("/", "layout");
  }
}
