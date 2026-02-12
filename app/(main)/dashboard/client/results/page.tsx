import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { ResultsTab } from "@/components/dashboard/client/results-tab";

export const dynamic = "force-dynamic";

export default async function ClientResultsPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const acct = await fetchSanityAccountByEmail({ email });
  
  if (!acct || acct.status === "disabled" || acct.type !== "client") {
    redirect("/dashboard");
  }

  const { data: analytics } = await sanityFetch({
    query: `*[_type == "analyticsRecord" && client._ref == $acctId] | order(metricDate desc)[0..49]{
      _id, metric, value, period, metricDate, note, visibility
    }`,
    params: { acctId: String(acct._id) },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Results</h1>
          <p className="text-muted-foreground">Performance metrics and analytics.</p>
        </div>
      </div>
      <ResultsTab analytics={(analytics as any[]) || []} />
    </div>
  );
}
