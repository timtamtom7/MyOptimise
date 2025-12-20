import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { fetchSanityEvents, fetchSanityOrganizations, fetchSanityAccountByEmail, fetchSanitySponsorshipsByEmail, fetchSanitySignupsByEmail } from "@/sanity/lib/fetch";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { Calendar as CalendarIcon, Clock as ClockIcon, MapPin as MapPinIcon } from "lucide-react";
import { safeGetServerSession } from "@/lib/auth";
import { t, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  const page = await fetchSanityPageBySlug({ slug: "index", locale });

  return generatePageMetadata({ page, slug: "index" });
}

export default async function IndexPage() {
  const session = await safeGetServerSession();
  const locale = await getLocale();
  const page = await fetchSanityPageBySlug({ slug: "index", locale });
  const email = (session as any)?.user?.email || "";
  const account = email ? await fetchSanityAccountByEmail({ email }) : null;
  const sponsorships = account?.type === "business" && email ? await fetchSanitySponsorshipsByEmail({ email }) : [];
  const signups = account?.type === "individual" && email ? await fetchSanitySignupsByEmail({ email, locale }) : [];
  const hasRightColumn =
    (account?.type === "business") ||
    (account?.type === "individual" && (signups as any[]).length > 0);
  const leftColClass = "max-w-3xl";

  if (!page || (page.blocks ?? []).length === 0) {
    const [events, orgs] = await Promise.all([
      fetchSanityEvents({ locale }),
      fetchSanityOrganizations({ locale }),
    ]);
    return (
      <div className="min-h-screen bg-background bg-[radial-gradient(900px_circle_at_top_left,rgba(244,114,182,0.20),transparent_60%)] dark:bg-none">
        <div className="container mx-auto px-4 pt-20 pb-24 md:pt-24 md:pb-28">
          <div className={hasRightColumn ? "grid grid-cols-1 md:grid-cols-2 gap-8 items-start" : "items-start"}>
            <div className={leftColClass}>
          {session ? (
            <h1 className="text-4xl md:text-5xl font-semibold">
              {(() => {
                const fullName = (session as any)?.user?.name || "";
                const firstName = fullName.includes(" ") ? fullName.split(" ")[0] : fullName;
                return `${t("welcome", locale)}${firstName ? `, ${firstName}` : ""}`;
              })()}
            </h1>
          ) : null}
          {session ? (
            account?.type !== "admin" ? (
              <h2 className="mt-2 text-2xl md:text-3xl font-semibold">
                {t("thanksHeadline", locale)}
              </h2>
            ) : (
              <h2 className="mt-2 text-2xl md:text-3xl font-semibold">
                {t("adminSubheading", locale)}
              </h2>
            )
          ) : (
            <h1 className="mt-2 text-5xl md:text-6xl font-semibold">
              {t("helpHeadline", locale)}
            </h1>
          )}
          <p className="mt-3 text-muted-foreground">
            {session ? t("heroSubLoggedIn", locale) : t("heroSubLoggedOut", locale)}
          </p>
          <div className="mt-6 flex gap-3">
            {account ? (
              <>
                {account.type === "admin" ? (
                  <Link href="/studio" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
                    {t("goToManagementStudio", locale)}
                  </Link>
                ) : account.type === "business" ? (
                  <Link href="/sponsor" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
                    {t("sponsorMeals", locale)}
                  </Link>
                ) : (
                  <Link href="/events" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
                    {t("volunteerNow", locale)}
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/choose" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
                  {t("volunteerNow", locale)}
                </Link>
                <Link href="/sponsor" className="rounded-md border px-4 py-2">
                  {t("sponsorMeals", locale)}
                </Link>
              </>
            )}
          </div>
          {account?.type === "business" && (sponsorships as any[]).length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold">{t("yourSponsorships", locale)}</h2>
              <div className="mt-4 grid gap-4">
                {(sponsorships as any[]).map((s) => (
                  <div key={s._id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{s.businessName}</div>
                        <div className="text-sm text-muted-foreground">
                          {(s.mealsCount ? `${s.mealsCount} meals` : "")} {(s.date ? `• ${new Date(s.date).toLocaleDateString()}` : "")} {(s.location ? `• ${s.location}` : "")}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-wide">Status: {s.status}</div>
                      </div>
                      <Link href="/sponsor" className="rounded-md border px-3 py-2">
                        Edit
                      </Link>
                    </div>
                    {s.notes ? <div className="mt-3 text-sm">{s.notes}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
            <div className="md:pl-4">
            {account?.type === "business" && (
              <div className="max-w-md md:max-w-none">
                <h2 className="text-xl font-semibold">{t("sponsorDistribution", locale)}</h2>
                <BusinessSponsorForm defaultEmail={email} defaultName={account?.name || ""} />
              </div>
            )}
            {account?.type === "individual" && (signups as any[]).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold">{t("yourVolunteering", locale)}</h2>
                <div className="mt-4 grid gap-3">
                  {(signups as any[]).map((s: any) => (
                    <div key={s._id} className="rounded-md border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{s.event?.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(s.event?.date).toLocaleString()} • {s.event?.location}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-wide">Status: {s.status}</div>
                        </div>
                        <Link href={`/proof/${s._id}`} className="rounded-md border px-3 py-2">
                          {t("uploadProof", locale)}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>

          <div className="mt-16 md:mt-20">
          <h2 className="text-xl font-semibold">{t("upcomingEvents", locale)}</h2>
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
              <div className="text-muted-foreground">{t("noUpcomingRegistrations", locale)}</div>
            ) : null}
          </div>
          </div>

          <div className="mt-16 md:mt-20">
          <h2 className="text-xl font-semibold">{t("partnerOrganizations", locale)}</h2>
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

          <div className="mt-16 md:mt-20">
          <h2 className="text-xl font-semibold">{t("distributionAreas", locale)}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("areasIntro", locale)}
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(900px_circle_at_top_left,rgba(244,114,182,0.20),transparent_60%)] dark:bg-none">
      <Blocks blocks={page?.blocks ?? []} />
    </div>
  );
}

async function submitSponsorship(formData: FormData) {
  "use server";
  const businessName = String(formData.get("businessName") || "");
  const contactEmail = String(formData.get("contactEmail") || "");
  const mealsCount = Number(formData.get("mealsCount") || 0);
  const date = String(formData.get("date") || "");
  const location = String(formData.get("location") || "");
  const notes = String(formData.get("notes") || "");
  if (!businessName || mealsCount <= 0) return;
  const { client } = await import("@/sanity/lib/client");
  const { token: previewToken } = await import("@/sanity/lib/token");
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  await writeClient.create({
    _type: "sponsorship",
    businessName,
    contactEmail,
    mealsCount,
    date: date ? new Date(date).toISOString() : undefined,
    location,
    notes,
    status: "submitted",
  });
}

function BusinessSponsorForm({ defaultEmail, defaultName }: { defaultEmail: string; defaultName: string }) {
  return (
    <form action={submitSponsorship} className="mt-4 grid gap-3 max-w-xl">
      <input name="businessName" defaultValue={defaultName} placeholder="Business name" className="rounded-md border px-3 py-2" required />
      <input name="contactEmail" type="email" defaultValue={defaultEmail} placeholder="Contact email" className="rounded-md border px-3 py-2" />
      <input name="mealsCount" type="number" min={1} placeholder="Meals count" className="rounded-md border px-3 py-2" required />
      <input name="date" type="date" className="rounded-md border px-3 py-2" />
      <input name="location" placeholder="Pickup/Delivery location" className="rounded-md border px-3 py-2" />
      <textarea name="notes" placeholder="Notes" className="rounded-md border px-3 py-2" rows={3} />
      <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Send Request</button>
    </form>
  );
}
