import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { fetchSanityEvents, fetchSanityOrganizations } from "@/sanity/lib/fetch";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { Calendar as CalendarIcon, Clock as ClockIcon, MapPin as MapPinIcon, Building2 } from "lucide-react";

export async function generateMetadata() {
  const page = await fetchSanityPageBySlug({ slug: "index" });

  return generatePageMetadata({ page, slug: "index" });
}

export default async function IndexPage() {
  const page = await fetchSanityPageBySlug({ slug: "index" });

  if (!page || (page.blocks ?? []).length === 0) {
    const [events, orgs] = await Promise.all([
      fetchSanityEvents(),
      fetchSanityOrganizations(),
    ]);
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-semibold">Help distribute meals across Hong Kong</h1>
          <p className="mt-3 text-muted-foreground">
            Join as a volunteer or sponsor distributions to support elderly and low‑income communities.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              href="/choose"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Volunteer Now
            </Link>
            <Link
              href="/sponsor"
              className="rounded-md border px-4 py-2"
            >
              Sponsor Meals
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {(events ?? []).slice(0, 3).map((event: any) => (
              <Link key={event._id} href={`/events/${event.slug.current}`}>
                <Card className="overflow-hidden h-full">
                  {event.image?.asset?.url && (
                    <div className="relative w-full h-36">
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
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {event.organization?.name ?? ""}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {(events ?? []).length === 0 ? (
              <div className="text-muted-foreground">No upcoming events</div>
            ) : null}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold">Partner Organizations</h2>
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            {(orgs ?? []).slice(0, 6).map((org: any) => (
              <Link key={org._id} href={`/organizations/${org.slug.current}`}>
                <Card className="overflow-hidden h-full">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex-none">
                      <Image
                        src={org.logo?.asset?.url || "/images/placeholder.svg"}
                        alt={org.name}
                        width={48}
                        height={48}
                        className="rounded-md object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <CardTitle>{org.name}</CardTitle>
                      <CardDescription>{org.website ?? ""}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold">Distribution Areas</h2>
          <p className="mt-2 text-muted-foreground">
            We organize distributions across Hong Kong. Explore areas where upcoming events take place.
          </p>
          <div className="mt-4 rounded-xl overflow-hidden border">
            <iframe
              title="Hong Kong Map"
              className="w-full h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7377.502155977221!2d114.1659703!3d22.2820534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x340400fd6b2a5c13%3A0x7f22a7b4c19e4b9!2sCentral%2C%20Hong%20Kong!5e0!3m2!1sen!2sus!4v1700000000000"
            />
          </div>
        </div>
      </div>
    );
  }

  return <Blocks blocks={page?.blocks ?? []} />;
}
