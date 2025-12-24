import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { fetchSanityPendingAccounts } from "@/sanity/lib/fetch";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import bcrypt from "bcryptjs";

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
      from: "Helping Hand <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  }
}

async function approveEvent(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  await writeClient.patch(id).set({ status: "approved" }).commit();
  try {
    const resendKey = process.env.RESEND_API_KEY || "";
    if (resendKey) {
      const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
      const resend = new Resend(resendKey);
      const event = await writeClient.fetch(
        `*[_type == "event" && _id == $id][0]{title, date, location, organization->{name, contactEmail}}`,
        { id }
      );
      const orgEmail = String(event?.organization?.contactEmail || "").trim();
      if (orgEmail) {
        await sendResendEmailWithFallback({
          resend,
          from: resendFrom,
          to: orgEmail,
          subject: "Your event has been approved",
          html: `<div style="font-family:system-ui,sans-serif">
            <p>Your event has been approved.</p>
            <p><strong>${event?.title ?? "Event"}</strong></p>
            <p>${event?.date ? new Date(event.date).toLocaleString() : ""}${event?.location ? ` • ${event.location}` : ""}</p>
          </div>`,
        });
      }
    }
  } catch {}
  revalidatePath("/events");
}

async function completeEvent(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  await writeClient.patch(id).set({ status: "completed" }).commit();
  revalidatePath(`/events/${id}`);
}

async function confirmSignup(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  await writeClient.patch(id).set({ status: "confirmed" }).commit();
  try {
    const resendKey = process.env.RESEND_API_KEY || "";
    if (resendKey) {
      const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
      const resend = new Resend(resendKey);
      const signup = await writeClient.fetch(`*[_type == "signup" && _id == $id][0]{email, name, event->{title, date, location}}`, { id });
      if (signup?.email) {
        await sendResendEmailWithFallback({
          resend,
          from: resendFrom,
          to: signup.email,
          subject: "Your volunteer registration is approved",
          html: `<div style="font-family:system-ui,sans-serif">
            <p>Your registration is confirmed for ${signup?.event?.title ?? "the event"}.</p>
            <p>${new Date(signup?.event?.date).toLocaleString()} • ${signup?.event?.location ?? ""}</p>
          </div>`,
        });
      }
    }
  } catch {}
  revalidatePath("/dashboard");
}

async function cancelSignup(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  await writeClient.patch(id).set({ status: "rejected" }).commit();
  try {
    const resendKey = process.env.RESEND_API_KEY || "";
    if (resendKey) {
      const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
      const resend = new Resend(resendKey);
      const signup = await writeClient.fetch(`*[_type == "signup" && _id == $id][0]{email, name, event->{title, date, location}}`, { id });
      if (signup?.email) {
        const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
        const dashboardUrl = siteUrl ? `${siteUrl}/dashboard?email=${encodeURIComponent(signup.email)}` : "";
        await sendResendEmailWithFallback({
          resend,
          from: resendFrom,
          to: signup.email,
          subject: "Your volunteer request was rejected",
          html: `<div style="font-family:system-ui,sans-serif">
            <p>Thanks for volunteering. We’re sorry, but your request was not approved.</p>
            <p><strong>${signup?.event?.title ?? "Event"}</strong></p>
            <p>${signup?.event?.date ? new Date(signup.event.date).toLocaleString() : ""}${signup?.event?.location ? ` • ${signup.event.location}` : ""}</p>
            ${dashboardUrl ? `<p>View your requests: <a href="${dashboardUrl}">${dashboardUrl}</a></p>` : ""}
          </div>`,
        });
      }
    }
  } catch {}
  revalidatePath("/dashboard");
}

async function approveSponsorship(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  await writeClient.patch(id).set({ status: "approved" }).commit();
  try {
    const resendKey = process.env.RESEND_API_KEY || "";
    if (resendKey) {
      const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
      const resend = new Resend(resendKey);
      const sponsorship = await writeClient.fetch(
        `*[_type == "sponsorship" && _id == $id][0]{businessName, contactEmail, mealsCount, date, location}`,
        { id }
      );
      const to = String(sponsorship?.contactEmail || "").trim();
      if (to) {
        await sendResendEmailWithFallback({
          resend,
          from: resendFrom,
          to,
          subject: "Your sponsorship has been approved",
          html: `<div style="font-family:system-ui,sans-serif">
            <p>Thanks for your support. Your sponsorship has been approved.</p>
            <p><strong>${sponsorship?.businessName ?? "Sponsorship"}</strong></p>
            <p>${sponsorship?.mealsCount ? `${sponsorship.mealsCount} meals` : ""}${sponsorship?.date ? ` • ${new Date(sponsorship.date).toLocaleDateString()}` : ""}${sponsorship?.location ? ` • ${sponsorship.location}` : ""}</p>
          </div>`,
        });
      }
    }
  } catch {}
  revalidatePath("/dashboard/business");
}

async function completeSponsorship(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  await writeClient.patch(id).set({ status: "completed" }).commit();
  try {
    const resendKey = process.env.RESEND_API_KEY || "";
    if (resendKey) {
      const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
      const resend = new Resend(resendKey);
      const sponsorship = await writeClient.fetch(
        `*[_type == "sponsorship" && _id == $id][0]{businessName, contactEmail, mealsCount, date, location}`,
        { id }
      );
      const to = String(sponsorship?.contactEmail || "").trim();
      if (to) {
        await sendResendEmailWithFallback({
          resend,
          from: resendFrom,
          to,
          subject: "Your sponsorship has been completed",
          html: `<div style="font-family:system-ui,sans-serif">
            <p>Your sponsorship has been marked as completed.</p>
            <p><strong>${sponsorship?.businessName ?? "Sponsorship"}</strong></p>
            <p>${sponsorship?.mealsCount ? `${sponsorship.mealsCount} meals` : ""}${sponsorship?.date ? ` • ${new Date(sponsorship.date).toLocaleDateString()}` : ""}${sponsorship?.location ? ` • ${sponsorship.location}` : ""}</p>
          </div>`,
        });
      }
    }
  } catch {}
  revalidatePath("/dashboard/business");
}

async function setSponsorshipLogo(formData: FormData) {
  const id = String(formData.get("id") || "");
  const file = formData.get("logo") as File | null;
  if (!id || !file) return;
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const asset = await writeClient.assets.upload("image", buffer, {
    filename: file.name || "business-logo.jpg",
    contentType: file.type || "image/jpeg",
  });
  await writeClient
    .patch(id)
    .set({ businessLogo: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
    .commit();
  revalidatePath("/dashboard/business");
}

export default async function AdminPage(props: {
  searchParams?: Promise<{ key?: string; emailTest?: string; emailTestMessage?: string }>
}) {
  const searchParams = (await props.searchParams) || {};
  const key = searchParams.key || "";
  const emailTest = searchParams.emailTest || "";
  const emailTestMessage = searchParams.emailTestMessage || "";
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) {
    return notFound();
  }

  const pendingAccounts = await fetchSanityPendingAccounts();
  const { data: pendingEvents } = await sanityFetch({
    query: `*[_type == "event" && status == "pending_review"] | order(date asc){_id, title, date, location, organization->{name}}`,
  });

  const { data: signups } = await sanityFetch({
    query: `*[_type == "signup" && status == "received"] | order(createdAt desc){
      _id, name, email, event->{_id, title, date, location}
    }`,
  });

  const { data: completedProofs } = await sanityFetch({
    query: `*[_type == "signup" && status == "completed"] | order(completedAt desc){
      _id, name, email, proofMedia[]{asset->{url}, _type}, event->{title, date}
    }`,
  });

  const { data: pendingSponsorships } = await sanityFetch({
    query: `*[_type == "sponsorship" && status == "submitted"] | order(_createdAt desc){
      _id, businessName, contactEmail, mealsCount, date, location, notes
    }`,
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold">Admin</h1>
      <p className="mt-2 text-muted-foreground">Use ?key=... to access. Approve events and manage signups.</p>
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

      <div className="mt-6 rounded-md border p-4">
        <form action={async () => {
          "use server";
          if (!process.env.SANITY_API_WRITE_TOKEN) {
            return;
          }
          const email = "tommaso.mauriello747@gmail.com";
          const password = "Tommaso7258";
          const existing = await fetchSanityAccountByEmail({ email });
          if (!existing) {
            const writeClient = client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN, perspective: "published" });
            const passwordHash = await bcrypt.hash(password, 10);
            await writeClient.create({
              _type: "account",
              email,
              name: "Admin",
              type: "admin",
              status: "approved",
              passwordHash,
            });
          } else if (existing.type !== "admin" || existing.status !== "approved") {
            const writeClient = client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN, perspective: "published" });
            await writeClient.patch(existing._id).set({ type: "admin", status: "approved" }).commit();
          }
          revalidatePath("/admin");
        }}>
          <button className="rounded-md border px-3 py-2" disabled={!process.env.SANITY_API_WRITE_TOKEN}>Seed Admin Account</button>
        </form>
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
              const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
              const resend = new Resend(process.env.RESEND_API_KEY);
              await sendResendEmailWithFallback({
                resend,
                from: resendFrom,
                to,
                subject: "Helping Hand test email",
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
        <form action={async () => {
          "use server";
          if (!process.env.SANITY_API_WRITE_TOKEN) {
            return;
          }
          const writeClient = client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN, perspective: "published" });
          const orgSlug = "helping-hand-hk";
          const existing = await writeClient.fetch(`*[_type == "organization" && slug.current == $slug][0]{_id}`, { slug: orgSlug });
          if (!existing?._id) {
            await writeClient.create({
              _type: "organization",
              name: "Helping Hand HK",
              slug: { _type: "slug", current: orgSlug },
              description: "Community partner organization in Hong Kong.",
              website: "https://example.org",
            });
          }
          revalidatePath("/organizations");
        }}>
          <button className="rounded-md border px-3 py-2" disabled={!process.env.SANITY_API_WRITE_TOKEN}>Seed Sample Organization</button>
        </form>
      </div>

      <div className="mt-6 rounded-md border p-4">
        <form action={async () => {
          "use server";
          if (!process.env.SANITY_API_WRITE_TOKEN) {
            return;
          }
          const writeClient = client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN, perspective: "published" });
          const orgSlug = "helping-hand-hk";
          const org = await writeClient.fetch(`*[_type == "organization" && slug.current == $slug][0]{_id}`, { slug: orgSlug });
          if (!org?._id) {
            return;
          }
          const eventSlug = "community-meal-distribution";
          const existing = await writeClient.fetch(`*[_type == "event" && slug.current == $slug][0]{_id}`, { slug: eventSlug });
          if (!existing?._id) {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            await writeClient.create({
              _type: "event",
              title: "Community Meal Distribution",
              slug: { _type: "slug", current: eventSlug },
              description: "Volunteer to distribute meals to the community.",
              date: date.toISOString(),
              location: "Mong Kok, Hong Kong",
              capacity: 50,
              category: "food",
              organization: { _type: "reference", _ref: org._id },
              status: "approved",
            });
          }
          revalidatePath("/events");
        }}>
          <button className="rounded-md border px-3 py-2" disabled={!process.env.SANITY_API_WRITE_TOKEN}>Seed Sample Event</button>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Accounts Pending Approval</h2>
        <div className="mt-4 grid gap-4">
          {(pendingAccounts ?? []).map((a: any) => (
            <div key={a._id} className="rounded-md border p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{a.name || a.email}</div>
                <div className="text-sm text-muted-foreground">{a.type}</div>
              </div>
              <div className="flex gap-3">
                <form action={async (fd: FormData) => {
                  "use server";
                  const id = String(fd.get("id") || "");
                  if (!id) return;
                  if (!process.env.SANITY_API_WRITE_TOKEN) return;
                  const writeClient = client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN, perspective: "published" });
                  const approved = await writeClient.patch(id).set({ status: "approved" }).commit();
                  const resendKey = process.env.RESEND_API_KEY || "";
                  if (resendKey) {
                    const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
                    const resend = new Resend(resendKey);
                    try {
                      const acct = approved as any;
                      await sendResendEmailWithFallback({
                        resend,
                        from: resendFrom,
                        to: acct.email,
                        subject: "Your account has been approved",
                        html: `<p>Your account is approved. You can now sign in.</p>`,
                      });
                      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
                      if (adminEmails.length) {
                        await sendResendEmailWithFallback({
                          resend,
                          from: resendFrom,
                          to: adminEmails,
                          subject: "Account approved",
                          html: `<p>Approved account: ${acct.email}</p><p>Sanity ID: ${acct._id}</p>`,
                        });
                      }
                    } catch {}
                  }
                  revalidatePath("/admin");
                }}>
                  <input type="hidden" name="id" value={a._id} />
                  <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground">Approve</button>
                </form>
                <form action={async (fd: FormData) => {
                  "use server";
                  const id = String(fd.get("id") || "");
                  if (!id) return;
                  if (!process.env.SANITY_API_WRITE_TOKEN) return;
                  const writeClient = client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN, perspective: "published" });
                  const denied = await writeClient.patch(id).set({ status: "denied" }).commit();
                  const resendKey = process.env.RESEND_API_KEY || "";
                  if (resendKey) {
                    const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
                    const resend = new Resend(resendKey);
                    try {
                      const acct = denied as any;
                      await sendResendEmailWithFallback({
                        resend,
                        from: resendFrom,
                        to: acct.email,
                        subject: "Your account request was denied",
                        html: `<p>We’re sorry, but your account request was denied.</p>`,
                      });
                      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
                      if (adminEmails.length) {
                        await sendResendEmailWithFallback({
                          resend,
                          from: resendFrom,
                          to: adminEmails,
                          subject: "Account denied",
                          html: `<p>Denied account: ${acct.email}</p><p>Sanity ID: ${acct._id}</p>`,
                        });
                      }
                    } catch {}
                  }
                  revalidatePath("/admin");
                }}>
                  <input type="hidden" name="id" value={a._id} />
                  <button className="rounded-md border px-3 py-2">Deny</button>
                </form>
              </div>
            </div>
          ))}
          {(pendingAccounts ?? []).length === 0 ? (
            <div className="text-muted-foreground">No accounts pending approval</div>
          ) : null}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Sponsorships Pending Review</h2>
        <div className="mt-4 grid gap-4">
          {(pendingSponsorships ?? []).map((s: any) => (
            <div key={s._id} className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.businessName}</div>
                  <div className="text-sm text-muted-foreground">
                    {s.mealsCount ? `${s.mealsCount} meals` : ""} {s.date ? `• ${new Date(s.date).toLocaleDateString()}` : ""} {s.location ? `• ${s.location}` : ""}
                  </div>
                  {s.contactEmail ? <div className="text-xs text-muted-foreground mt-1">{s.contactEmail}</div> : null}
                </div>
                <div className="flex gap-3">
                  <form action={approveSponsorship}>
                    <input type="hidden" name="id" value={s._id} />
                    <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground">Approve</button>
                  </form>
                  <form action={completeSponsorship}>
                    <input type="hidden" name="id" value={s._id} />
                    <button className="rounded-md border px-3 py-2">Mark Completed</button>
                  </form>
                </div>
              </div>
              {s.notes ? <div className="mt-3 text-sm">{s.notes}</div> : null}
              <div className="mt-3">
                <form action={setSponsorshipLogo} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={s._id} />
                  <input type="file" name="logo" accept="image/*" className="rounded-md border px-2 py-1" />
                  <button className="rounded-md border px-3 py-2">Upload Logo</button>
                </form>
              </div>
            </div>
          ))}
          {(pendingSponsorships ?? []).length === 0 ? (
            <div className="text-muted-foreground">No sponsorships pending review</div>
          ) : null}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Events Pending Review</h2>
        <div className="mt-4 grid gap-4">
          {(pendingEvents ?? []).map((e: any) => (
            <div key={e._id} className="rounded-md border p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(e.date).toLocaleString()} • {e.location} • {e.organization?.name ?? ""}
                </div>
              </div>
              <div className="flex gap-3">
                <form action={approveEvent}>
                  <input type="hidden" name="id" value={e._id} />
                  <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground">Approve</button>
                </form>
                <form action={completeEvent}>
                  <input type="hidden" name="id" value={e._id} />
                  <button className="rounded-md border px-3 py-2">Mark Completed</button>
                </form>
              </div>
            </div>
          ))}
          {(pendingEvents ?? []).length === 0 ? (
            <div className="text-muted-foreground">No events pending review</div>
          ) : null}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">New Signups</h2>
        <div className="mt-4 grid gap-4">
          {(signups ?? []).map((s: any) => (
            <div key={s._id} className="rounded-md border p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{s.name} — {s.email}</div>
                <div className="text-sm text-muted-foreground">
                  {s.event?.title} • {new Date(s.event?.date).toLocaleString()} • {s.event?.location}
                </div>
              </div>
              <div className="flex gap-3">
                <form action={confirmSignup}>
                  <input type="hidden" name="id" value={s._id} />
                  <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground">Confirm</button>
                </form>
                <form action={cancelSignup}>
                  <input type="hidden" name="id" value={s._id} />
                  <button className="rounded-md border px-3 py-2">Reject</button>
                </form>
              </div>
            </div>
          ))}
          {(signups ?? []).length === 0 ? (
            <div className="text-muted-foreground">No new signups</div>
          ) : null}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Completed Proofs</h2>
        <div className="mt-4 grid gap-4">
          {(completedProofs ?? []).map((c: any) => (
            <div key={c._id} className="rounded-md border p-4">
              <div className="font-medium">{c.name} — {c.email}</div>
              <div className="text-sm text-muted-foreground">
                {c.event?.title} • {new Date(c.event?.date).toLocaleString()}
              </div>
              {(c.proofMedia ?? []).length > 0 ? (
                <div className="mt-2 grid gap-2">
                  {(c.proofMedia ?? []).map((m: any, idx: number) => (
                    <a key={idx} href={m?.asset?.url} target="_blank" rel="noopener noreferrer" className="underline text-sm">
                      View {m?._type === "image" ? "image" : "file"} {idx + 1}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {(completedProofs ?? []).length === 0 ? (
            <div className="text-muted-foreground">No completed proofs yet</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
