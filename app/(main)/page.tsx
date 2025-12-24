import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { fetchSanityEvents, fetchSanityOrganizations, fetchSanityAccountByEmail, fetchSanitySponsorshipsByEmail, fetchSanitySignupsByEmail } from "@/sanity/lib/fetch";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const leftColClass = hasRightColumn ? "max-w-3xl" : "w-full";

  if (!page || (page.blocks ?? []).length === 0) {
    const [events, orgs] = await Promise.all([
      fetchSanityEvents({ locale }),
      fetchSanityOrganizations({ locale }),
    ]);
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-10 pb-16 md:pt-12 md:pb-20">
          <div className={hasRightColumn ? "grid grid-cols-1 md:grid-cols-2 gap-8 items-start" : "items-start"}>
            <div className={hasRightColumn ? leftColClass : "w-full"}>
          <Card className="w-full border-0 shadow-none rounded-[33px] bg-[#ffd0ef] p-10 md:p-14">
          {session ? (
            <h1 className="text-5xl md:text-7xl leading-[0.95] tracking-[-0.06em] text-[#b8325c]">
              {(() => {
                const fullName = (session as any)?.user?.name || "";
                const firstName = fullName.includes(" ") ? fullName.split(" ")[0] : fullName;
                return `${t("welcome", locale)}${firstName ? `, ${firstName}` : ""}!`;
              })()}
            </h1>
          ) : null}
          {session ? (
            account?.type !== "admin" ? (
              <h2 className="mt-4 text-2xl md:text-4xl leading-tight text-[#b8325c]">
                {t("thanksHeadline", locale)}
              </h2>
            ) : (
              <h2 className="mt-4 text-2xl md:text-4xl leading-tight text-[#b8325c]">
                {t("adminSubheading", locale)}
              </h2>
            )
          ) : (
            <h1 className="text-5xl md:text-7xl leading-[0.95] tracking-[-0.06em] text-[#b8325c]">
              {t("helpHeadline", locale)}
            </h1>
          )}
          <p className="mt-4 text-sm md:text-base text-[#b8325c] opacity-80">
            {session ? t("heroSubLoggedIn", locale) : t("heroSubLoggedOut", locale)}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {account ? (
              <>
                {account.type === "admin" ? (
                  <Button asChild className="rounded-[33px] px-10">
                    <Link href="/studio">{t("goToManagementStudio", locale)}</Link>
                  </Button>
                ) : account.type === "business" ? (
                  <Button variant="blue-pill" asChild className="rounded-[33px] px-10">
                    <Link href="/sponsor">{t("sponsorMeals", locale)}</Link>
                  </Button>
                ) : (
                  <Button asChild className="rounded-[33px] px-10">
                    <Link href="/events">{t("volunteerNow", locale)}</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button asChild className="rounded-[33px] px-10">
                  <Link href="/choose">{t("volunteerNow", locale)}</Link>
                </Button>
                <div className="hidden sm:block text-xs font-semibold text-[#b8325c] px-2">
                  OR
                </div>
                <Button variant="blue-pill" asChild className="rounded-[33px] px-10">
                  <Link href="/sponsor">{t("sponsorMeals", locale)}</Link>
                </Button>
              </>
            )}
          </div>
          </Card>
          {account?.type === "business" && (sponsorships as any[]).length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold">{t("yourSponsorships", locale)}</h2>
              <div className="mt-4 grid gap-4">
                {(sponsorships as any[]).map((s) => (
                  <div
                    key={s._id}
                    className="rounded-md border border-[rgba(70,140,205,0.35)] bg-[rgba(207,232,255,0.35)] p-4"
                  >
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
              <div className="max-w-md md:max-w-none rounded-3xl bg-[rgba(207,232,255,0.70)] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                <h2 className="text-xl font-semibold">{t("sponsorDistribution", locale)}</h2>
                <BusinessSponsorForm defaultEmail={email} defaultName={account?.name || ""} />
              </div>
            )}
            {account?.type === "individual" && (signups as any[]).length > 0 && (
              <div className="rounded-3xl bg-[rgba(255,208,239,0.55)] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                <h2 className="text-xl font-semibold">{t("yourVolunteering", locale)}</h2>
                <div className="mt-4 grid gap-3">
                  {(signups as any[]).map((s: any) => (
                    <div key={s._id} className="rounded-md border border-[rgba(184,50,92,0.28)] bg-[rgba(255,247,229,0.65)] p-4">
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
          <h2 className="text-xl font-semibold text-[#b8325c]">{t("upcomingEvents", locale)}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {(events ?? []).slice(0, 3).map((event: any) => (
              <Link key={event._id} href={`/events/${event.slug.current}`}>
                <Card
                  className="overflow-hidden h-full bg-card transition-transform hover:-translate-y-1"
                  style={{ backgroundColor: "var(--card)" }}
                >
                  {event.image?.asset?.url && (
                    <div className="relative w-full h-36">
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
                      {event.category ? (
                        <Badge variant="secondary">
                          {event.category === "food"
                            ? t("filterFood", locale)
                            : event.category === "elderly"
                              ? t("filterElderly", locale)
                              : event.category === "community"
                                ? t("filterCommunity", locale)
                                : event.category}
                        </Badge>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle
                      className="italic tracking-[-0.04em] text-2xl leading-[1.06]"
                      style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
                    >
                      {event.title}
                    </CardTitle>
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
                <Card className="overflow-hidden h-full bg-[rgba(207,232,255,0.70)] transition-transform hover:-translate-y-1">
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
          <div className="mt-4 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <iframe
              title="Hong Kong Map"
              className="w-full h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Central%2C%20Hong%20Kong&output=embed"
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
  const inputClassName =
    "rounded-md border border-[rgba(70,140,205,0.45)] bg-[rgba(255,247,229,0.75)] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(70,140,205,0.35)]";
  return (
    <form action={submitSponsorship} className="mt-4 grid gap-3 max-w-xl">
      <input name="businessName" defaultValue={defaultName} placeholder="Business name" className={inputClassName} required />
      <input name="contactEmail" type="email" defaultValue={defaultEmail} placeholder="Contact email" className={inputClassName} />
      <input name="mealsCount" type="number" min={1} placeholder="Meals count" className={inputClassName} required />
      <input name="date" type="date" className={inputClassName} />
      <input name="location" placeholder="Pickup/Delivery location" className={inputClassName} />
      <textarea name="notes" placeholder="Notes" className={inputClassName} rows={3} />
      <Button type="submit" variant="blue-pill" className="w-full h-11 rounded-[33px] text-base font-semibold">
        Send Request
      </Button>
    </form>
  );
}
