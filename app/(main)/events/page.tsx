import Segmented from "@/components/ui/segmented";
import { fetchSanityEvents } from "@/sanity/lib/fetch";
import { getLocale, t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

export default async function EventsPage(props: { searchParams?: Promise<{ filter?: string }> }) {
  const searchParams = (await props.searchParams) || {};
  const filter = searchParams.filter;
  const locale = await getLocale();
  const events = await fetchSanityEvents({ locale });
  const filtered =
    filter && filter !== "all" ? events.filter((e: any) => e.category === filter) : events;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <Card className="mb-8 bg-card" style={{ backgroundColor: "var(--card)" }}>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1
                className="italic text-3xl md:text-4xl leading-[1.06] tracking-[-0.04em]"
                style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
              >
                {t("volunteeringEvents", locale)}
              </h1>
              <p className="text-sm opacity-80" style={{ color: "var(--primary)" }}>
                {t("upcomingEvents", locale)}
              </p>
            </div>
            <Segmented
              options={[
                { label: t("filterAll", locale), value: "all" },
                { label: t("filterFood", locale), value: "food" },
                { label: t("filterElderly", locale), value: "elderly" },
                { label: t("filterCommunity", locale), value: "community" },
              ]}
              param="filter"
            />
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event: any) => {
            const categoryLabel =
              event.category === "food"
                ? t("filterFood", locale)
                : event.category === "elderly"
                  ? t("filterElderly", locale)
                  : event.category === "community"
                    ? t("filterCommunity", locale)
                    : null;

            return (
              <Link key={event._id} href={`/events/${event.slug.current}`} className="block">
                <Card
                  className="overflow-hidden h-full bg-card transition-transform hover:-translate-y-1"
                  style={{ backgroundColor: "var(--card)" }}
                >
                  {event.image?.asset?.url && (
                    <div className="relative w-full h-40">
                      <Image
                        src={event.image.asset.url}
                        alt={event.title ?? "Event"}
                        fill
                        className="object-cover rounded-t-2xl"
                      />
                    </div>
                  )}
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      {categoryLabel ? <Badge variant="secondary">{categoryLabel}</Badge> : <span />}
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <CardTitle
                        className="italic tracking-[-0.04em] text-2xl leading-[1.06]"
                        style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
                      >
                        {event.title}
                      </CardTitle>
                      <CardDescription>
                        {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                        {event.location}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {event.organization?.name ?? ""}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
