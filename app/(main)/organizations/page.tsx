import { fetchSanityOrganizations } from "@/sanity/lib/fetch";
import { getLocale } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default async function OrganizationsPage() {
  const locale = await getLocale();
  const organizations = await fetchSanityOrganizations({ locale });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">Organizations</h1>
      <p className="mt-2 text-muted-foreground">
        Browse partner organizations supporting community food distribution.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {organizations.map((org: any) => (
          <Link
            key={org._id}
            href={`/organizations/${org.slug?.current}`}
            className="block rounded-3xl transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
          >
            <Card className="overflow-hidden h-full bg-accent/70 transition-transform hover:-translate-y-1">
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
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {org.description ?? ""}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
