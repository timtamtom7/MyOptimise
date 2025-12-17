import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { client } from "@/sanity/lib/client";
import { Resend } from "resend";
import { redirect } from "next/navigation";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

async function submitSignup(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const phone = String(formData.get("phone") || "");
  const eventId = String(formData.get("eventId") || "");

  if (!name || !email || !eventId) {
    return;
  }

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const signup = await writeClient.create({
    _type: "signup",
    event: { _type: "reference", _ref: eventId },
    name,
    email,
    phone,
    status: "received",
    createdAt: new Date().toISOString(),
  });
  if (process.env.RESEND_API_KEY) {
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
  revalidatePath("/events");
  redirect(`/dashboard?email=${encodeURIComponent(email)}`);
}

import { fetchSanityEventBySlug } from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";

export default async function SignupPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/choose?next=/events/${params.slug}/signup`);
  }
  const email = (session as any)?.user?.email || "";
  if (email) {
    const account = await fetchSanityAccountByEmail({ email });
    if (!account || account.status !== "approved") {
      redirect(`/login?type=individual&pending=1`);
    }
  } else {
    redirect(`/login?type=individual`);
  }
  const event = await fetchSanityEventBySlug({ slug: params.slug });
  if (!event) notFound();

  return (
    <div className="container mx-auto px-4 py-10">
      {event.image?.asset?.url && (
        <div className="relative w-full h-56 md:h-72 lg:h-80 rounded-xl overflow-hidden">
          <img
            src={event.image.asset.url}
            alt={event.title ?? "Event"}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold">Volunteer for {event.title}</h1>
          <p className="mt-3 text-muted-foreground">
            {new Date(event.date).toLocaleString()} • {event.location}
          </p>
          <p className="mt-6 leading-relaxed">{event.description}</p>
        </div>
        <div className="md:col-span-1">
          <div className="rounded-xl border p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">Organization</div>
            <div className="mt-1 font-medium">{event.organization?.name ?? "Community Partner"}</div>
            <div className="mt-4 text-sm text-muted-foreground">Capacity</div>
            <div className="mt-1 font-medium">{event.capacity ?? "Open"}</div>
            <form action={submitSignup} className="mt-6 grid gap-3">
              <input type="hidden" name="eventId" value={event._id} />
              <input
                className="rounded-md border px-3 py-2"
                name="name"
                placeholder="Full name"
                required
              />
              <input
                className="rounded-md border px-3 py-2"
                name="email"
                type="email"
                placeholder="Email"
                required
              />
              <input
                className="rounded-md border px-3 py-2"
                name="phone"
                placeholder="Phone (optional)"
              />
              <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
                Volunteer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
