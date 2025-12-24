import { fetchSanitySponsorshipsByEmail } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";

export default async function BusinessDashboardPage(props: { searchParams?: Promise<{ email?: string }> }) {
  const searchParams = (await props.searchParams) || {};
  const email = searchParams.email || "";

  const sponsorships = email ? await fetchSanitySponsorshipsByEmail({ email }) : [];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold">Your Sponsorships</h1>
      <p className="mt-2 text-muted-foreground">
        Enter your email to view sponsorship requests and their status.
      </p>

      <form method="get" className="mt-6 flex gap-3 max-w-md">
        <input
          name="email"
          defaultValue={email}
          placeholder="Business contact email"
          type="email"
          className="rounded-md border border-[rgba(70,140,205,0.35)] bg-[rgba(255,247,229,0.65)] px-3 py-2 flex-1"
          required
        />
        <button className="rounded-md bg-[var(--cta-blue)] px-4 py-2 text-[color:var(--cta-blue-border)]">View</button>
      </form>

      {email && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Sponsorship Requests</h2>
          <div className="mt-4 grid gap-4">
            {sponsorships.map((s: any) => (
              <div key={s._id} className="rounded-md border border-[rgba(70,140,205,0.35)] bg-[rgba(207,232,255,0.35)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {s.businessLogo?.asset?.url && (
                      <div className="relative w-24 h-24 mb-2">
                        <Image
                          src={s.businessLogo.asset.url}
                          alt={s.businessName ?? "Logo"}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="font-medium">{s.businessName}</div>
                    <div className="text-sm text-muted-foreground">
                      {s.mealsCount ? `${s.mealsCount} meals` : ""} {s.date ? `• ${new Date(s.date).toLocaleDateString()}` : ""} {s.location ? `• ${s.location}` : ""}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-wide">Status: {s.status}</div>
                  </div>
                  <div className="flex gap-3">
                    <Link href="/sponsor" className="rounded-md border px-3 py-2">
                      Edit
                    </Link>
                  </div>
                </div>
                {s.notes ? <div className="mt-3 text-sm">{s.notes}</div> : null}
              </div>
            ))}
            {sponsorships.length === 0 ? (
              <div className="text-muted-foreground">No sponsorships found for {email}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
