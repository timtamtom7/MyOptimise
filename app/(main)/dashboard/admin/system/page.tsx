import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { hasAccountCapability } from "@/lib/capabilities";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { SystemTab } from "@/components/dashboard/admin/system-tab";

export const dynamic = "force-dynamic";

async function requireActiveAdmin() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return null;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) return null;
  if (acct.status === "disabled") return null;
  if (String(acct.type || "").toLowerCase() !== "admin") return null;
  return { session, acct, email };
}

export default async function AdminSystemPage() {
  const admin = await requireActiveAdmin();
  if (!admin) {
    redirect("/dashboard");
  }

  // Fetch Feature Flags
  const { data: featureFlags } = await sanityFetch({
    query: `*[_type == "featureFlag"] | order(key asc)`,
    perspective: "published",
  });

  async function upsertFeatureFlag(formData: FormData) {
    "use server";
    const admin = await requireActiveAdmin();
    if (!admin) return;
    if (!hasAccountCapability(admin.acct, "system.feature_flags.manage")) return;

    const id = String(formData.get("id") || "").trim();
    const keyRaw = String(formData.get("key") || "").trim();
    const key = keyRaw.toLowerCase();
    const enabled = String(formData.get("enabled") || "") === "on";
    const description = String(formData.get("description") || "").trim();

    if (!id && !key) return;
    const keyOk = key ? /^[a-z0-9][a-z0-9._-]*$/i.test(key) : true;
    if (!keyOk) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    if (id) {
      const existing = await writeClient.fetch(`*[_type == "featureFlag" && _id == $id][0]{_id, key}`, { id });
      if (!existing?._id) return;
      await writeClient.patch(id).set({ enabled, description: description || "" }).commit();
      await writeAuditLog({
        actorAccountId: String(admin.acct._id),
        action: "featureFlag.updated",
        targetId: String(existing._id),
        targetType: "featureFlag",
        targetLabel: String(existing.key || id),
        context: { id, enabled, description },
      });
      revalidatePath("/dashboard/admin/system");
      return;
    }

    const existingByKey = await writeClient.fetch(`*[_type == "featureFlag" && key == $key][0]{_id, key}`, { key });
    if (existingByKey?._id) {
      await writeClient.patch(String(existingByKey._id)).set({ enabled, description: description || "" }).commit();
      await writeAuditLog({
        actorAccountId: String(admin.acct._id),
        action: "featureFlag.updated",
        targetId: String(existingByKey._id),
        targetType: "featureFlag",
        targetLabel: String(existingByKey.key || key),
        context: { id: String(existingByKey._id), key, enabled, description },
      });
    } else {
      const created = await writeClient.create({
        _type: "featureFlag",
        key,
        enabled,
        description: description || "",
      });
      await writeAuditLog({
        actorAccountId: String(admin.acct._id),
        action: "featureFlag.created",
        targetId: String(created?._id || ""),
        targetType: "featureFlag",
        targetLabel: String(created?.key || key),
        context: { key, enabled, description },
      });
    }

    revalidatePath("/dashboard/admin/system");
  }

  async function deleteFeatureFlag(formData: FormData) {
    "use server";
    const admin = await requireActiveAdmin();
    if (!admin) return;
    if (!hasAccountCapability(admin.acct, "system.feature_flags.manage")) return;

    const id = String(formData.get("id") || "").trim();
    if (!id) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const existing = await writeClient.fetch(`*[_type == "featureFlag" && _id == $id][0]{_id, key}`, { id });
    if (!existing?._id) return;

    await writeClient.delete(id);
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "featureFlag.deleted",
      targetId: String(existing._id),
      targetType: "featureFlag",
      targetLabel: String(existing.key || id),
      context: { id, key: String(existing.key || "") },
    });

    revalidatePath("/dashboard/admin/system");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-muted-foreground">Manage feature flags and system settings.</p>
      </div>
      <SystemTab 
        featureFlags={featureFlags as any[]} 
        capabilities={{
            canManageFeatureFlags: hasAccountCapability(admin.acct, "system.feature_flags.manage")
        }}
        actions={{
          upsertFeatureFlag,
          deleteFeatureFlag
        }}
      />
    </div>
  );
}
