import { fetchSanityOrganizationBySlug, fetchSanityOrganizationsStaticParams } from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getLocale } from "@/lib/i18n";

export async function generateStaticParams() {
  const orgs = await fetchSanityOrganizationsStaticParams();
  return orgs.map((o: any) => ({ slug: o.slug?.current }));
}

export default async function OrganizationPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const locale = await getLocale();
  const org = await fetchSanityOrganizationBySlug({ slug: params.slug, locale });
  if (!org) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold">{org.name}</h1>
      {org.website ? (
        <p className="mt-2">
          <a href={org.website} target="_blank" rel="noopener noreferrer" className="underline">
            {org.website}
          </a>
        </p>
      ) : null}
      {org.contactEmail ? (
        <p className="mt-1 text-muted-foreground">{org.contactEmail}</p>
      ) : null}
      {org.description ? <p className="mt-4">{org.description}</p> : null}

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Upcoming Events</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {(org.events ?? []).map((event: any) => (
            <Link key={event._id} href={`/events/${event.slug.current}`}>
              <Card>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>
                    {new Date(event.date).toLocaleString()} • {event.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Capacity: {event.capacity ?? "—"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {(org.events ?? []).length === 0 ? (
            <div className="text-muted-foreground">No upcoming events</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
