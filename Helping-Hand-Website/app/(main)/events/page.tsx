import Segmented from "@/components/ui/segmented";
import { fetchSanityEvents } from "@/sanity/lib/fetch";
import { getLocale, t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";

export default async function EventsPage(props: { searchParams?: Promise<{ filter?: string }> }) {
  const searchParams = (await props.searchParams) || {};
  const filter = searchParams.filter;
  const locale = await getLocale();
  const events = await fetchSanityEvents({ locale });
  const filtered =
    filter && filter !== "all" ? events.filter((e: any) => e.category === filter) : events;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("volunteeringEvents", locale)}</h1>
        <Segmented
          options={[
            { label: t("filterAll", locale), value: "all" },
            { label: t("filterFood", locale), value: "food" },
            { label: t("filterElderly", locale), value: "elderly" },
            { label: t("filterCommunity", locale), value: "community" },
          ]}
          param="filter"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((event: any) => (
          <a key={event._id} href={`/events/${event.slug.current}`}>
            <Card>
              {event.image?.asset?.url && (
                <div className="relative w-full h-40">
                  <Image
                    src={event.image.asset.url}
                    alt={event.title ?? "Event"}
                    fill
                    className="object-cover rounded-t-md"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  {new Date(event.date).toLocaleString()} • {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {event.organization?.name ?? ""}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
