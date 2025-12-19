import { fetchSanityEventBySlug, fetchSanityEventsStaticParams } from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock as ClockIcon, MapPin as MapPinIcon } from "lucide-react";
import { getLocale, t } from "@/lib/i18n";

export async function generateStaticParams() {
  const items = await fetchSanityEventsStaticParams();
  return items.map((e) => ({ slug: e.slug?.current }));
}

export default async function EventPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const locale = await getLocale();
  const event = await fetchSanityEventBySlug({ slug: params.slug, locale });
  if (!event) notFound();

  const dt = new Date(event.date);
  const dateLabel = dt.toLocaleDateString();
  const timeLabel = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="container mx-auto px-6 py-12 flex justify-center">
      <div className="w-full max-w-lg">
        {event.organization?.name ? (
          <div className="flex items-center gap-2 mb-8">
            <span className="text-[11px] text-muted-foreground uppercase tracking-widest">{t("hostedBy", locale)}</span>
            <span className="text-[11px] font-medium uppercase tracking-widest">{event.organization.name}</span>
          </div>
        ) : null}

        <header className="space-y-6 mb-10">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
            {event.title}
          </h1>
          {event.description ? (
            <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
              {event.description}
            </p>
          ) : null}
        </header>

        <div className="flex flex-wrap gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{dateLabel}</p>
              <p className="text-xs text-muted-foreground">{dt.toLocaleDateString(undefined, { weekday: "long" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <ClockIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{timeLabel}</p>
              <p className="text-xs text-muted-foreground">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            </div>
          </div>
          {event.location ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <MapPinIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{event.location}</p>
                <p className="text-xs text-muted-foreground">{event.organization?.name ?? ""}</p>
              </div>
            </div>
          ) : null}
        </div>

        {event.location ? (
          <div className="relative w-full h-36 rounded-lg overflow-hidden border border-border mb-10">
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={event.location}
            />
          </div>
        ) : null}

        <div className="mb-8">
          <Link
            href={`/events/${params.slug}/signup`}
            className="inline-flex w-full justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            {t("volunteerNow", locale)}
          </Link>
        </div>

        {typeof event.capacity === "number" ? (
          <footer className="mt-6 text-center">
            <p className="text-[11px] text-muted-foreground tracking-wide">
              {event.capacity} {t("seatsAvailableSuffix", locale)}
            </p>
          </footer>
        ) : null}
      </div>
    </main>
  );
}
