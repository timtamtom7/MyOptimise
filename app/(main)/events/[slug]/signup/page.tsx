import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { redirect } from "next/navigation";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { t } from "@/lib/i18n";

import { fetchSanityEventBySlug } from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/i18n";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SignupPage(props: { params: Promise<{ slug: string }>; searchParams?: Promise<{ pending?: string }> }) {
  const params = await props.params;
  const sp = (await props.searchParams) || {};
  const pending = sp.pending;
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/choose?next=/events/${params.slug}/signup`);
  }
  const email = (session as any)?.user?.email || "";
  const name = (session as any)?.user?.name || "";
  if (email) {
    const account = await fetchSanityAccountByEmail({ email });
    if (!account || account.status !== "approved") {
      redirect(`/login?type=individual&pending=1`);
    }
  } else {
    redirect(`/login?type=individual`);
  }
  const locale = await getLocale();
  const event = await fetchSanityEventBySlug({ slug: params.slug, locale });
  if (!event) notFound();

  return (
    <div className="container mx-auto px-4 py-10">
      {pending && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-40" />
          <div className="fixed z-50 left-1/2 top-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
            <div className="text-xl font-semibold">{t("requestSubmitted", locale)}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {t("pendingModalBody", locale)}
            </div>
            <div className="mt-6 flex gap-3">
              <Link href="/" className="rounded-md bg-primary px-4 py-2 text-primary-foreground flex-1 text-center">{t("goHome", locale)}</Link>
              <Link href="/events" className="rounded-md border px-4 py-2 flex-1 text-center">{t("browseEvents", locale)}</Link>
            </div>
          </div>
        </>
      )}
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold">{t("volunteerFor", locale)} {event.title}</h1>
          <p className="mt-3 text-muted-foreground">
            {new Date(event.date).toLocaleString()} • {event.location}
          </p>
          <p className="mt-6 leading-relaxed">{event.description}</p>
        </div>
        <div className="md:col-span-1">
          <div className="rounded-xl border p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">{t("organizationLabel", locale)}</div>
            <div className="mt-1 font-medium">{event.organization?.name ?? t("communityPartner", locale)}</div>
            <div className="mt-4 text-sm text-muted-foreground">{t("capacityLabel", locale)}</div>
            <div className="mt-1 font-medium">{event.capacity ?? t("openCapacity", locale)}</div>
            <form method="post" action={`/events/${params.slug}/signup/submit`} className="mt-6 grid gap-3">
              <input type="hidden" name="eventId" value={event._id} />
              <input
                className="rounded-md border px-3 py-2"
                name="name"
                defaultValue={name}
                placeholder={t("fullName", locale)}
                required
              />
              <input
                className="rounded-md border px-3 py-2"
                name="email"
                type="email"
                defaultValue={email}
                placeholder={t("emailAddress", locale)}
                required
              />
              <input
                className="rounded-md border px-3 py-2"
                name="phone"
                placeholder={t("phoneOptional", locale)}
              />
              <div className="text-sm text-muted-foreground">
                {t("approvalEmailNotice", locale)}
              </div>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
                {t("volunteerAction", locale)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
