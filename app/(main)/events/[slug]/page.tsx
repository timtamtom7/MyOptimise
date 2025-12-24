import { fetchSanityEventBySlug, fetchSanityEventsStaticParams } from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock as ClockIcon, MapPin as MapPinIcon } from "lucide-react";
import { getLocale, t } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden" style={{ backgroundColor: "var(--card)" }}>
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {event.organization?.name ? (
                    <Badge variant="outline">
                      {t("hostedBy", locale)} {event.organization.name}
                    </Badge>
                  ) : null}
                  <Badge variant="secondary">{dateLabel}</Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle
                    className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.06] italic"
                    style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
                  >
                    {event.title}
                  </CardTitle>
                  {event.description ? (
                    <CardDescription className="text-base leading-relaxed">
                      {event.description}
                    </CardDescription>
                  ) : null}
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="h-full bg-secondary">
                <CardHeader className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/70">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{dateLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      {dt.toLocaleDateString(undefined, { weekday: "long" })}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="h-full bg-secondary">
                <CardHeader className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/70">
                    <ClockIcon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{timeLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {event.location ? (
                <Card className="h-full sm:col-span-2 lg:col-span-1 bg-secondary">
                  <CardHeader className="space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{event.location}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.organization?.name ?? ""}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ) : null}
            </div>

            {event.location ? (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative w-full h-56">
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
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="bg-card" style={{ backgroundColor: "var(--card)" }}>
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle
                    className="text-lg font-semibold italic"
                    style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
                  >
                    {t("volunteerNow", locale)}
                  </CardTitle>
                  {typeof event.capacity === "number" ? (
                    <Badge variant="outline">
                      {event.capacity} {t("seatsAvailableSuffix", locale)}
                    </Badge>
                  ) : null}
                </div>
                <Button asChild className="w-full">
                  <Link href={`/events/${params.slug}/signup`}>{t("volunteerNow", locale)}</Link>
                </Button>
                <CardDescription>
                  {t("approvalEmailNotice", locale)}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-secondary">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold">{t("details", locale)}</CardTitle>
                <CardDescription className="space-y-2">
                  <div>{t("consentPictures", locale)}</div>
                  <div>{t("uploadProof", locale)}</div>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
