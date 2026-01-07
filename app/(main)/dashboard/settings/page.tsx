import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import SignOutButton from "@/components/auth/signout-button";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

export default async function DashboardSettingsPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/settings");
  }

  const email = String((session as any)?.user?.email || "");
  if (!email) redirect("/login?next=/dashboard/settings");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) redirect("/login?error=no_account&next=/dashboard/settings");
  if (String(acct.status || "") === "disabled") redirect("/login?error=disabled&next=/dashboard/settings");

  const type = String(acct?.type || (session as any)?.type || "");

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = type;
  let isImpersonating = false;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status, capabilities, revokedCapabilities, avatar, timezone, locale, notificationPreferences, lastLoginAt, loginHistory}`,
      params: { id: impersonateId },
      perspective: "published",
    });
    const target = (targetRes as any)?.data as any;
    if (target?._id && String(target.status || "") !== "disabled") {
      effectiveAcct = target;
      effectiveType = String(target.type || "");
      isImpersonating = true;
    }
  }

  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;
  const canEditProfile = hasAccountCapability(effectiveAcct, "identity.profile.edit_own");
  const canEditTimezoneLocale = hasAccountCapability(effectiveAcct, "identity.preferences.timezone_locale");
  const canEditNotifications = hasAccountCapability(effectiveAcct, "identity.preferences.notifications");
  const canViewLoginActivity = hasAccountCapability(effectiveAcct, "identity.security.last_login_activity");
  const canLogoutAllDevices = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating && hasAccountCapability(acct, "identity.session.logout_all");

  async function updateSettings(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || String(acct.status || "") === "disabled") return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const patch: Record<string, unknown> = {};

    const name = String(formData.get("name") || "").trim();
    if (name && hasAccountCapability(acct, "identity.profile.edit_own")) {
      patch.name = name;
    }

    const avatar = formData.get("avatar");
    if (hasAccountCapability(acct, "identity.profile.edit_own") && avatar && typeof avatar !== "string") {
      const file = avatar as File;
      if (file.size > 0 && String(file.type || "").startsWith("image/")) {
        const asset = await writeClient.assets.upload("image", file, { filename: file.name });
        const uploadedAssetId = String(asset?._id || "");
        if (uploadedAssetId) {
          patch.avatar = { _type: "image", asset: { _type: "reference", _ref: uploadedAssetId } };
        }
      }
    }

    const timezone = String(formData.get("timezone") || "").trim();
    const locale = String(formData.get("locale") || "").trim();
    if (hasAccountCapability(acct, "identity.preferences.timezone_locale")) {
      patch.timezone = timezone || null;
      patch.locale = locale || null;
    }

    const emailUpdates = String(formData.get("emailUpdates") || "") === "on";
    const inAppUpdates = String(formData.get("inAppUpdates") || "") === "on";
    if (hasAccountCapability(acct, "identity.preferences.notifications")) {
      patch.notificationPreferences = {
        emailUpdates,
        inAppUpdates,
      };
    }

    if (Object.keys(patch).length === 0) return;

    await writeClient.patch(String(acct._id)).set(patch).commit();
    revalidatePath("/dashboard/settings");
    redirect("/dashboard/settings");
  }

  const loginHistory = Array.isArray((effectiveAcct as any).loginHistory) ? (effectiveAcct as any).loginHistory : [];
  const lastLoginAt = String((effectiveAcct as any).lastLoginAt || "");
  const avatarUrl = (effectiveAcct as any)?.avatar ? urlFor((effectiveAcct as any).avatar).width(128).height(128).url() : "";

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="text-sm text-muted-foreground">{String(effectiveAcct.email || "")}</div>
      </div>

      {!canWrite ? (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating ? `Impersonation mode (${effectiveType}): actions are read-only.` : "Missing SANITY_API_WRITE_TOKEN: settings updates are disabled."}
        </div>
      ) : null}

      <form action={updateSettings} className="mt-6 grid gap-6" encType="multipart/form-data">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Profile</div>
          <div className="mt-3 grid gap-3">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-muted">
                {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="64px" className="object-cover" /> : null}
              </div>
              <div className="flex-1 grid gap-1">
                <label className="text-sm font-medium" htmlFor="avatar">
                  Avatar
                </label>
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  className="rounded-md border px-3 py-2 text-sm"
                  disabled={!canWrite || !canEditProfile}
                />
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                defaultValue={String(effectiveAcct.name || "")}
                className="rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite || !canEditProfile}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Preferences</div>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="timezone">
                Timezone
              </label>
              <input
                id="timezone"
                name="timezone"
                defaultValue={String((effectiveAcct as any).timezone || "")}
                className="rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite || !canEditTimezoneLocale}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="locale">
                Locale
              </label>
              <input
                id="locale"
                name="locale"
                defaultValue={String((effectiveAcct as any).locale || "")}
                className="rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite || !canEditTimezoneLocale}
              />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Notifications</div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="emailUpdates"
                  defaultChecked={Boolean((effectiveAcct as any).notificationPreferences?.emailUpdates ?? true)}
                  disabled={!canWrite || !canEditNotifications}
                />
                Email updates
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="inAppUpdates"
                  defaultChecked={Boolean((effectiveAcct as any).notificationPreferences?.inAppUpdates ?? true)}
                  disabled={!canWrite || !canEditNotifications}
                />
                In-app updates
              </label>
            </div>
          </div>
        </div>

        <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
          Save changes
        </button>
      </form>

      <div className="mt-8 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Security</div>
        <div className="mt-3">
          <SignOutButton
            variant="outline"
            size="sm"
            triggerClassName="w-full justify-center"
            showLogoutAll={canLogoutAllDevices}
          />
          {!canLogoutAllDevices ? (
            <div className="mt-2 text-xs text-muted-foreground">Your account can’t sign out everywhere.</div>
          ) : null}
        </div>

        {canViewLoginActivity ? (
          <div className="mt-6">
            <div className="text-lg font-medium">Login activity</div>
            <div className="mt-3 grid gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Last login:</span>{" "}
                <span>{lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "—"}</span>
              </div>
              <div className="mt-2">
                <div className="text-muted-foreground">Recent logins</div>
                <div className="mt-2 space-y-2">
                  {loginHistory.slice(-10).reverse().map((e: any, idx: number) => (
                    <div key={idx} className="rounded-md border px-3 py-2">
                      <div className="font-medium">{String(e?.provider || "unknown")}</div>
                      <div className="text-muted-foreground">
                        {String(e?.createdAt || "") ? new Date(String(e.createdAt)).toLocaleString() : "—"}
                      </div>
                    </div>
                  ))}
                  {loginHistory.length === 0 ? <div className="text-muted-foreground">No login history yet.</div> : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
