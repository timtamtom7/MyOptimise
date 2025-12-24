import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";
import type { Resend } from "resend";

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const origin = request.nextUrl.origin;
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
    const fd = await request.formData();
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const phone = String(fd.get("phone") || "");
    const eventId = String(fd.get("eventId") || "");
    if (!name || !email || !eventId) {
      return new NextResponse("Missing fields", { status: 400 });
    }
    const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken || "";
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
    await writeClient.create({
      _type: "signup",
      event: { _type: "reference", _ref: eventId },
      name,
      email,
      phone,
      status: "received",
      createdAt: new Date().toISOString(),
    });

    const event = await writeClient.fetch(
      `*[_type == "event" && _id == $id][0]{title, date, location, organization->{name, contactEmail}}`,
      { id: eventId }
    );

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
      await sendResendEmailWithFallback({
        resend,
        from: resendFrom,
        to: email,
        subject: "Volunteer request received",
        html: `<div style="font-family:system-ui,sans-serif">
          <h2>Thanks for volunteering</h2>
          <p>We received your request and will review it shortly.</p>
          <p>${event?.title ?? "Event"}${event?.date ? ` • ${new Date(event.date).toLocaleString()}` : ""}${event?.location ? ` • ${event.location}` : ""}</p>
          <p>View your registrations: <a href="${siteUrl}/dashboard?email=${encodeURIComponent(
            email
          )}">${siteUrl}/dashboard?email=${encodeURIComponent(email)}</a></p>
        </div>`,
      });

      const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const orgEmail = String(event?.organization?.contactEmail || "").trim();
      const notifyTo = [...adminEmails, orgEmail].filter(Boolean);
      if (notifyTo.length > 0) {
        const subject = `New volunteer request: ${event?.title ?? slug}`;
        await sendResendEmailWithFallback({
          resend,
          from: resendFrom,
          to: notifyTo,
          subject,
          html: `<div style="font-family:system-ui,sans-serif">
            <h2>${subject}</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
            <p><strong>Event:</strong> ${event?.title ?? ""}</p>
            <p>${event?.date ? new Date(event.date).toLocaleString() : ""}${event?.location ? ` • ${event.location}` : ""}</p>
            <p>Review in studio: <a href="${siteUrl}/studio">${siteUrl}/studio</a></p>
          </div>`,
        });
      }
    }
    const url = new URL(`/events/${slug}/signup?pending=1`, origin);
    return NextResponse.redirect(url, { status: 303 });
  } catch {
    return new NextResponse("Server error", { status: 500 });
  }
}
