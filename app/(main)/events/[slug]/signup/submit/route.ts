import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
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
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Helping Hand <no-reply@helpinghand.hk>",
        to: email,
        subject: "Volunteer registration received",
        html: `<div style="font-family:system-ui,sans-serif">
          <h2>Thanks for volunteering</h2>
          <p>We received your registration for the event.</p>
          <p>View your registrations: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?email=${encodeURIComponent(
            email
          )}">${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?email=${encodeURIComponent(email)}</a></p>
        </div>`,
      });
    }
    const url = new URL(
      `/events/${slug}/signup?pending=1`,
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3003"
    );
    return NextResponse.redirect(url, { status: 303 });
  } catch {
    return new NextResponse("Server error", { status: 500 });
  }
}
