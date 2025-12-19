import { fetchSanitySignupsByEmail, fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import Link from "next/link";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { t, getLocale } from "@/lib/i18n";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage(props: { searchParams?: Promise<{ email?: string }> }) {
  const session = await getServerSession(authOptions);
  const searchParams = (await props.searchParams) || {};
  const email = (session as any)?.user?.email || searchParams.email || "";
  const locale = await getLocale();

  const signups = email ? await fetchSanitySignupsByEmail({ email, locale }) : [];

  if (session && email && signups.length === 0) {
    redirect("/events");
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("yourVolunteering", locale)}</h1>
      {!email ? (
        <>
          <p className="mt-2 text-muted-foreground">
            Enter your email to view registered events and upload proof after distribution.
          </p>
          <form method="get" className="mt-6 flex gap-3 max-w-md">
            <input
              name="email"
              defaultValue={email}
              placeholder="Your email"
              type="email"
              className="rounded-md border px-3 py-2 flex-1"
              required
            />
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">View</button>
          </form>
        </>
      ) : null}

      {email && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold">{t("calendar", locale)}</h2>
          <div className="mt-2">
            <a
              href={`/api/ical?email=${encodeURIComponent(email)}`}
              className="rounded-md border px-3 py-2 inline-block"
            >
              {t("downloadICal", locale)}
            </a>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {signups
              .slice()
              .sort((a: any, b: any) => new Date(a.event?.date).getTime() - new Date(b.event?.date).getTime())
              .map((s: any) => (
                <div key={`cal-${s._id}`} className="rounded-md border p-4">
                  <div className="text-sm text-muted-foreground">
                    {new Date(s.event?.date).toLocaleString()}
                  </div>
                  <div className="mt-1 font-medium">{s.event?.title}</div>
                  <div className="text-sm">{s.event?.location}</div>
                </div>
              ))}
            {signups.length === 0 ? (
              <div className="text-muted-foreground">{t("noUpcomingRegistrations", locale)}</div>
            ) : null}
          </div>

          <h2 className="text-xl font-semibold">{t("registeredEvents", locale)}</h2>
          <div className="mt-4 grid gap-4">
            {signups.map((s: any) => (
              <div key={s._id} className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.event?.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(s.event?.date).toLocaleString()} • {s.event?.location}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-wide">
                      Status: {s.status}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/events/${s.event?.slug?.current}`}
                      className="rounded-md border px-3 py-2"
                    >
                      {t("details", locale)}
                    </Link>
                    <Link
                      href={`/proof/${s._id}`}
                      className="rounded-md bg-primary px-3 py-2 text-primary-foreground"
                    >
                      {t("uploadProof", locale)}
                    </Link>
                    <form action={async () => {
                      if (!process.env.RESEND_API_KEY) return;
                      const resend = new Resend(process.env.RESEND_API_KEY);
                      await resend.emails.send({
                        from: "Helping Hand <no-reply@helpinghand.hk>",
                        to: s.email,
                        subject: "Reminder: Upcoming distribution",
                        html: `<div style="font-family:system-ui,sans-serif">
                          <p>Reminder for ${s.event?.title} on ${new Date(s.event?.date).toLocaleString()}.</p>
                          <p>Event details: ${s.event?.location}</p>
                          <p>View your registrations: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?email=${encodeURIComponent(
                            email
                          )}">${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?email=${encodeURIComponent(email)}</a></p>
                        </div>`,
                      });
                      revalidatePath("/dashboard");
                    }}>
                      <button className="rounded-md border px-3 py-2">{t("sendReminder", locale)}</button>
                    </form>
                    <form action={async () => {
                      if (!process.env.RESEND_API_KEY) return;
                      const resend = new Resend(process.env.RESEND_API_KEY);
                      await resend.emails.send({
                        from: "Helping Hand <no-reply@helpinghand.hk>",
                        to: s.email,
                        subject: "Please upload proof of distribution",
                        html: `<div style="font-family:system-ui,sans-serif">
                          <p>Upload proof for ${s.event?.title}.</p>
                          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/proof/${s._id}">Upload proof</a></p>
                        </div>`,
                      });
                      revalidatePath("/dashboard");
                    }}>
                      <button className="rounded-md border px-3 py-2">{t("sendProofPrompt", locale)}</button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
            {signups.length === 0 ? (
              <div className="text-muted-foreground">{t("noRegistrationsFoundFor", locale)} {email}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
