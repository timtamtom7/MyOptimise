import { safeGetServerSession, IMPERSONATE_COOKIE_NAME } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = IMPERSONATE_COOKIE_NAME;

export default async function DashboardFeedbackPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login?next=/dashboard/feedback");

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  if (!acct) redirect("/login?error=no_account&next=/dashboard/feedback");
  if (String(acct.status || "") === "disabled") redirect("/login?error=disabled&next=/dashboard/feedback");

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let isImpersonating = false;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status, capabilities, revokedCapabilities}`,
      params: { id: impersonateId },
      perspective: "published",
    });
    const target = (targetRes as any)?.data as any;
    if (target?._id && String(target.status || "") !== "disabled") {
      effectiveAcct = target;
      isImpersonating = true;
    }
  }

  if (!hasAccountCapability(effectiveAcct, "system.feedback.submit")) redirect("/dashboard");

  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;

  async function submitFeedback(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
    if (!acct || String(acct.status || "") === "disabled") return;
    if (!hasAccountCapability(acct, "system.feedback.submit")) return;

    const category = String(formData.get("category") || "bug").trim();
    const message = String(formData.get("message") || "").trim();
    const url = String(formData.get("url") || "").trim();
    if (!message) return;
    if (!["bug", "feature", "general"].includes(category)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    await writeClient.create({
      _type: "feedback",
      category,
      message,
      ...(url ? { url } : {}),
      fromEmail: String(acct.email || "").toLowerCase(),
      fromAccount: { _type: "reference", _ref: String(acct._id) },
      status: "new",
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/dashboard/feedback");
    redirect("/dashboard/feedback?sent=1");
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <div className="text-sm text-muted-foreground">{String(effectiveAcct.email || "")}</div>
      </div>

      {!canWrite ? (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating
            ? "Impersonation mode: feedback submission is read-only."
            : "Missing SANITY_API_WRITE_TOKEN: feedback submission is disabled."}
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Submit</div>
        <form action={submitFeedback} className="mt-3 grid gap-3">
          <select name="category" className="rounded-md border px-3 py-2 text-sm" defaultValue="bug" disabled={!canWrite}>
            <option value="bug">Bug</option>
            <option value="feature">Feature request</option>
            <option value="general">General</option>
          </select>
          <input name="url" placeholder="URL (optional)" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite} />
          <textarea
            name="message"
            placeholder="What happened? What did you expect?"
            className="min-h-[140px] rounded-md border px-3 py-2 text-sm"
            disabled={!canWrite}
          />
          <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
