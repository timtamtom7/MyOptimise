import { sanityFetch } from "@/sanity/lib/live";
import { AccountForm } from "@/components/admin/account-form";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import bcrypt from "bcryptjs";
import { writeAuditLog } from "@/lib/audit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";

async function sendResendEmailWithFallback({
  resend,
  from,
  to,
  subject,
  html,
}: {
  resend: Resend;
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    await resend.emails.send({ from, to, subject, html });
    return;
  } catch {
    if (from.toLowerCase().includes("onboarding@resend.dev")) throw new Error("resend_send_failed");
    await resend.emails.send({
      from: "Optimise Operations <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  }
}

async function upsertAccount(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "employee").trim();
  const status = String(formData.get("status") || "active").trim();
  const password = String(formData.get("password") || "");
  const capabilities = String(formData.get("capabilities") || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
  const revokedCapabilities = String(formData.get("revokedCapabilities") || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
  const avatar = formData.get("avatar");
  if (!email) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;

  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  
  let avatarAssetId: string | undefined;
  if (avatar && typeof avatar !== "string" && (avatar as File).size > 0) {
    const file = avatar as File;
    if (String(file.type || "").startsWith("image/")) {
       const asset = await writeClient.assets.upload("image", file, { filename: file.name });
       avatarAssetId = String(asset?._id || "");
    }
  }

  const existing = await fetchSanityAccountByEmail({ email });
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  if (!existing) {
    const created = await writeClient.create({
      _type: "account",
      email,
      name,
      type,
      status,
      capabilities,
      revokedCapabilities,
      sessionVersion: 1,
      ...(passwordHash ? { passwordHash } : {}),
      ...(avatarAssetId ? { avatar: { _type: "image", asset: { _type: "reference", _ref: avatarAssetId } } } : {}),
    });
    await writeAuditLog({
      action: "account.created",
      targetId: String(created?._id || ""),
      targetType: "account",
      targetLabel: email,
      context: { email, name, type, status, passwordSet: Boolean(passwordHash), capabilities, revokedCapabilities, avatarSet: Boolean(avatarAssetId) },
    });
  } else {
    const patch: Record<string, unknown> = { email, name, type, status, capabilities, revokedCapabilities };
    if (passwordHash) patch.passwordHash = passwordHash;
    if (avatarAssetId) patch.avatar = { _type: "image", asset: { _type: "reference", _ref: avatarAssetId } };
    
    await writeClient.patch(existing._id).set(patch).commit();
    await writeAuditLog({
      action: "account.updated",
      targetId: String(existing._id),
      targetType: "account",
      targetLabel: email,
      context: { email, name, type, status, passwordUpdated: Boolean(passwordHash), capabilities, revokedCapabilities, avatarUpdated: Boolean(avatarAssetId) },
    });
  }
  revalidatePath("/admin");
}

async function setAccountStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !status) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;

  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  await writeClient.patch(id).set({ status }).commit();
  await writeAuditLog({
    action: "account.status_set",
    targetId: id,
    targetType: "account",
    targetLabel: id,
    context: { id, status },
  });
  revalidatePath("/admin");
}

export default async function AdminPage(props: {
  searchParams?: Promise<{
    key?: string;
    emailTest?: string;
    emailTestMessage?: string;
    inviteEmail?: string;
  }>
}) {
  const searchParams = (await props.searchParams) || {};
  const key = searchParams.key || "";
  const emailTest = searchParams.emailTest || "";
  const emailTestMessage = searchParams.emailTestMessage || "";
  const inviteEmail = searchParams.inviteEmail || "";
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) {
    return notFound();
  }

  const inviteBaseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const inviteLink = inviteEmail
    ? `${inviteBaseUrl}/login?email=${encodeURIComponent(inviteEmail)}`
    : "";

  const { data: accounts } = await sanityFetch({
    query: `*[_type == "account"] | order(_createdAt desc){_id, email, name, type, status}`,
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold">Admin</h1>
      <p className="mt-2 text-muted-foreground">Use ?key=... to access.</p>
      {!sanityConfigured && (
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          Setup required: Sanity is not configured for this deployment. Set NEXT_PUBLIC_SANITY_PROJECT_ID and
          NEXT_PUBLIC_SANITY_DATASET (and restart the server).
        </div>
      )}
      {!process.env.SANITY_API_WRITE_TOKEN && (
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          Setup required: missing SANITY_API_WRITE_TOKEN. Admin actions that write to Sanity are disabled.
        </div>
      )}
      {!process.env.RESEND_API_KEY && (
        <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
          Email notifications are disabled: missing RESEND_API_KEY.
        </div>
      )}
      {emailTest ? (
        <div className="mt-4 rounded-md border px-3 py-2 text-sm">
          {emailTest === "sent" ? "Test email sent." : "Test email failed."} {emailTestMessage ? `(${emailTestMessage})` : ""}
        </div>
      ) : null}
      {inviteEmail && inviteLink ? (
        <div className="mt-4 rounded-md border px-3 py-2 text-sm">
          <div className="font-medium">Invite link</div>
          <div className="mt-1 break-all text-muted-foreground">{inviteLink}</div>
        </div>
      ) : null}


      <div className="mt-6 rounded-md border p-4">
        <h2 className="text-lg font-semibold">Create / Update Account</h2>
        <AccountForm 
          action={upsertAccount} 
          writeTokenExists={!!process.env.SANITY_API_WRITE_TOKEN} 
        />
      </div>


      <div className="mt-6 rounded-md border p-4">
        <h2 className="text-lg font-semibold">Email Test</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sends a single test message using the configured email provider.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 max-w-lg"
          action={async (fd: FormData) => {
            "use server";
            const to = String(fd.get("to") || "");
            const keyParam = process.env.ADMIN_KEY ? `?key=${encodeURIComponent(key)}` : "";
            if (!process.env.RESEND_API_KEY) {
              redirect(`/admin${keyParam}${keyParam ? "&" : "?"}emailTest=failed&emailTestMessage=missing_resend_key`);
            }
            if (!to) {
              redirect(`/admin${keyParam}${keyParam ? "&" : "?"}emailTest=failed&emailTestMessage=missing_to`);
            }
            try {
              const resendFrom = process.env.RESEND_FROM || "Optimise Operations <onboarding@resend.dev>";
              const resend = new Resend(process.env.RESEND_API_KEY);
              await sendResendEmailWithFallback({
                resend,
                from: resendFrom,
                to,
                subject: "Optimise Operations test email",
                html: `<p>If you received this, email sending is working.</p>`,
              });
              redirect(`/admin${keyParam}${keyParam ? "&" : "?"}emailTest=sent`);
            } catch {
              redirect(`/admin${keyParam}${keyParam ? "&" : "?"}emailTest=failed&emailTestMessage=send_failed`);
            }
          }}
        >
          <input
            name="to"
            type="email"
            placeholder="To email address"
            defaultValue={(process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean)[0] || ""}
            className="rounded-md border px-3 py-2"
          />
          <button className="rounded-md border px-3 py-2" disabled={!process.env.RESEND_API_KEY}>
            Send Test Email
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-md border p-4">
        <h2 className="text-lg font-semibold">Invite with Google</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates an active account for this email. The user must sign in with the exact Google email.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 max-w-lg"
          action={async (fd: FormData) => {
            "use server";
            const email = String(fd.get("email") || "").trim();
            const type = String(fd.get("type") || "employee").trim();
            if (!email) return;
            const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
            if (!writeToken) return;
            const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
            const existing = await fetchSanityAccountByEmail({ email });
            if (!existing) {
              const created = await writeClient.create({
                _type: "account",
                email,
                name: "",
                type,
                status: "active",
                sessionVersion: 1,
              });
              await writeAuditLog({
                action: "account.invited_google",
                targetId: String(created?._id || ""),
                targetType: "account",
                targetLabel: email,
                context: { email, type, created: true },
              });
            } else {
              await writeClient.patch(existing._id).set({ status: "active", type }).commit();
              await writeAuditLog({
                action: "account.invited_google",
                targetId: String(existing._id),
                targetType: "account",
                targetLabel: email,
                context: { email, type, created: false },
              });
            }

            if (process.env.RESEND_API_KEY) {
              const resendFrom = process.env.RESEND_FROM || "Optimise Operations <onboarding@resend.dev>";
              const resend = new Resend(process.env.RESEND_API_KEY);
              const baseUrl = (
                process.env.NEXT_PUBLIC_SITE_URL ||
                process.env.NEXTAUTH_URL ||
                "http://localhost:3000"
              ).replace(/\/$/, "");
              const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}`;
              await sendResendEmailWithFallback({
                resend,
                from: resendFrom,
                to: email,
                subject: "Your Optimise Operations access link",
                html: `<p>You’ve been granted access. Sign in with Google using <strong>${email}</strong>.</p><p><a href="${loginUrl}">Open sign-in</a></p>`,
              });
            }

            const keyParam = process.env.ADMIN_KEY ? `?key=${encodeURIComponent(key)}` : "";
            const qs = `${keyParam}${keyParam ? "&" : "?"}inviteEmail=${encodeURIComponent(email)}`;
            revalidatePath("/admin");
            redirect(`/admin${qs}`);
          }}
        >
          <div className="grid gap-3">
            <input name="email" type="email" placeholder="user@company.com" className="rounded-md border px-3 py-2" />
            <select name="type" className="rounded-md border px-3 py-2" defaultValue="employee">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="client">Client</option>
            </select>
          </div>
          <button className="mt-3 rounded-md bg-primary px-3 py-2 text-primary-foreground" disabled={!process.env.SANITY_API_WRITE_TOKEN}>
            Create account (and email link if configured)
          </button>
        </form>
      </div>
      <div className="mt-10">
        <h2 className="text-xl font-semibold">Accounts</h2>
        <div className="mt-4 grid gap-3">
          {(accounts ?? []).map((a: any) => (
            <div key={a._id} className="rounded-md border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={a.avatar ? urlFor(a.avatar).url() : undefined} />
                  <AvatarFallback seed={a.email}>
                    {(a.name || a.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{a.name || a.email}</div>
                  <div className="text-sm text-muted-foreground">{a.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {a.type} • {a.status || "active"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin?editEmail=${encodeURIComponent(a.email)}&key=${key}`}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                >
                  Edit
                </Link>
                {a.status === "disabled" ? (
                  <form action={setAccountStatus}>
                    <input type="hidden" name="id" value={a._id} />
                    <input type="hidden" name="status" value="active" />
                    <button className="rounded-md border px-3 py-2" disabled={!process.env.SANITY_API_WRITE_TOKEN}>
                      Enable
                    </button>
                  </form>
                ) : (
                  <form action={setAccountStatus}>
                    <input type="hidden" name="id" value={a._id} />
                    <input type="hidden" name="status" value="disabled" />
                    <button className="rounded-md border px-3 py-2" disabled={!process.env.SANITY_API_WRITE_TOKEN}>
                      Disable
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {(accounts ?? []).length === 0 ? <div className="text-muted-foreground">No accounts</div> : null}
        </div>
      </div>
    </div>
  );
}
