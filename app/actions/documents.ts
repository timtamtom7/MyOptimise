"use server";

import { safeGetServerSession, IMPERSONATE_COOKIE_NAME } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const IMPERSONATE_COOKIE = IMPERSONATE_COOKIE_NAME;

function normalizeIdList(input: unknown): string[] {
  return String(input || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function uploadDocument(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) throw new Error("Cannot upload in impersonation mode");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || String(acct.status || "") === "disabled") throw new Error("Account disabled");
  if (!hasAccountCapability(acct, "documents.upload")) throw new Error("Permission denied");

  const title = String(formData.get("title") || "").trim();
  const folder = String(formData.get("folder") || "").trim();
  const visibility = String(formData.get("visibility") || "internal").trim();
  const shareWithIds = normalizeIdList(formData.get("shareWithIds"));
  const docFile = formData.get("file");

  if (!title) throw new Error("Title is required");
  if (!docFile || typeof docFile === "string") throw new Error("File is required");
  
  const file = docFile as File;
  if (!file.size) throw new Error("File is empty");
  if (!["internal", "client"].includes(visibility)) throw new Error("Invalid visibility");
  if (visibility !== "internal" && !hasAccountCapability(acct, "documents.share.clients")) throw new Error("Cannot share with clients");

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) throw new Error("Configuration error");
  
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const asset = await writeClient.assets.upload("file", file, { filename: file.name });
  const uploadedAssetId = String(asset?._id || "");
  if (!uploadedAssetId) throw new Error("Upload failed");

  const requestedShares = shareWithIds.slice(0, 50);
  let sharedWith: Array<{ _type: "reference"; _ref: string }> = [];
  
  if (requestedShares.length) {
    const targets: Array<{ _id: string; type: string; status: string }> = await writeClient.fetch(
      `*[_type == "account" && _id in $ids]{_id, type, status}`,
      { ids: requestedShares },
    );
    const allowed = (targets ?? [])
      .filter((t) => String(t.status || "") !== "disabled")
      .filter((t) => {
        const tType = String(t.type || "");
        const isTargetClient = tType === "client";
        return isTargetClient ? hasAccountCapability(acct, "documents.share.clients") : hasAccountCapability(acct, "documents.share.team");
      })
      .map((t) => ({ _type: "reference" as const, _ref: String(t._id) }));
    sharedWith = allowed;
  }

  await writeClient.create({
    _type: "documentItem",
    title,
    ...(folder ? { folder } : {}),
    visibility,
    file: { _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } },
    sharedWith,
    createdBy: { _type: "reference", _ref: String(acct._id) },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/dashboard/documents");
}

export async function updateDocumentSharing(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) throw new Error("Cannot update in impersonation mode");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || String(acct.status || "") === "disabled") throw new Error("Account disabled");

  const id = String(formData.get("id") || "").trim();
  const visibility = String(formData.get("visibility") || "").trim();
  const shareWithIds = normalizeIdList(formData.get("shareWithIds"));

  if (!id) throw new Error("ID required");
  if (visibility && !["internal", "client"].includes(visibility)) throw new Error("Invalid visibility");

  if (!hasAccountCapability(acct, "documents.permissions.set")) throw new Error("Permission denied");

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) throw new Error("Configuration error");

  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const existing = await writeClient.fetch(
    `*[_type == "documentItem" && _id == $id][0]{_id, createdBy->{_id}}`,
    { id },
  );
  
  if (!existing?._id) throw new Error("Document not found");
  
  const creatorId = String(existing?.createdBy?._id || "");
  const isOwner = creatorId && creatorId === String(acct._id || "");
  
  if (!isOwner && acct.type !== "admin") throw new Error("Permission denied");

  const requestedShares = shareWithIds.slice(0, 50);
  let sharedWith: Array<{ _type: "reference"; _ref: string }> = [];
  
  if (requestedShares.length) {
    const targets: Array<{ _id: string; type: string; status: string }> = await writeClient.fetch(
      `*[_type == "account" && _id in $ids]{_id, type, status}`,
      { ids: requestedShares },
    );
    const allowed = (targets ?? [])
      .filter((t) => String(t.status || "") !== "disabled")
      .filter((t) => {
        const tType = String(t.type || "");
        const isTargetClient = tType === "client";
        return isTargetClient ? hasAccountCapability(acct, "documents.share.clients") : hasAccountCapability(acct, "documents.share.team");
      })
      .map((t) => ({ _type: "reference" as const, _ref: String(t._id) }));
    sharedWith = allowed;
  }

  const patch: Record<string, unknown> = {
    sharedWith,
    updatedAt: new Date().toISOString(),
  };
  
  if (visibility) {
    if (visibility !== "internal" && !hasAccountCapability(acct, "documents.share.clients")) throw new Error("Cannot share with clients");
    patch.visibility = visibility;
  }
  
  await writeClient.patch(id).set(patch).commit();

  revalidatePath("/dashboard/documents");
}
