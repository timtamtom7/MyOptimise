import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientView } from "@/components/dashboard/client/client-view";
import { submitClientRequest } from "@/app/actions/client";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

export default async function ClientDashboardPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/client");
  }
  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "");
  if (!type) {
    redirect("/login?error=no_account&next=/dashboard/client");
  }
  if (String((acct as any)?.status || "") === "disabled") {
    redirect("/login?error=disabled&next=/dashboard/client");
  }

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = type;
  let isImpersonating = false;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status, timezone}`,
      params: { id: impersonateId },
      perspective: "published",
    });
    const target = (targetRes as any)?.data as any;
    if (target?._id && String(target.status || "") !== "disabled") {
      effectiveAcct = target;
      effectiveType = String(target.type || "");
      isImpersonating = true;
    }
  }

  if (effectiveType !== "client") {
    redirect("/dashboard");
  }

  const name = String((session as any)?.user?.name || "");
  const emailLower = String(effectiveAcct?.email || email || "").toLowerCase();
  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;
  const canViewServices = hasAccountCapability(effectiveAcct, "client.services.view");
  const acctId = String(effectiveAcct?._id || "");

  // Minimal data fetching for the overview dashboard
  const [
    myRequestsRes,
    clientWorkItemsRes,
    clientServicesRes,
    myDeliverablesRes,
    activeCampaignRes,
    contentItemsRes,
    analyticsRes,
    myThreadsRes,
  ] = await Promise.all([
    sanityFetch({
      query: `*[_type == "clientRequest" && clientEmail != null && lower(clientEmail) == $email] | order(createdAt desc)[0..9]{
        _id, status
      }`,
      params: { email: emailLower },
    }),
    sanityFetch({
      query: `*[_type == "workItem" && isTemplate != true && visibility == "client" && clientAccount._ref == $acctId] | order(coalesce(dueDate, createdAt) asc)[0..19]{
        _id, status
      }`,
      params: { acctId },
    }),
    canViewServices
      ? sanityFetch({
        query: `*[_type == "clientService" && client._ref == $acctId] | order(coalesce(updatedAt, createdAt) desc)[0..49]{
            _id, status
          }`,
        params: { acctId },
      })
      : Promise.resolve({ data: [] }),
    sanityFetch({
      query: `*[_type == "deliverable" && campaign->client._ref == $acctId] | order(createdAt desc) {
          _id, status, "campaignTitle": campaign->title
        }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "campaign" && client._ref == $acctId && status in ["active", "planned"]] | order(startDate asc){
          _id, title, description, startDate, endDate, status
        }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "contentItem" && client._ref == $acctId]{
          _id, title, scheduledAt, status, platform, postType,
          "firstAssetUrl": media[0].asset->url,
          "firstAssetMime": media[0].asset->mimeType
        }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "analyticsRecord" && client._ref == $acctId] | order(metricDate desc)[0..0]{
        _id, metric, value, metricDate
      }`,
      params: { acctId },
    }),
    sanityFetch({
        query: `*[_type == "messageThread" && visibility == "client" && $acctId in participants[]._ref] | order(coalesce(updatedAt, createdAt) desc)[0..0]{
          _id
        }`,
        params: { acctId: String(effectiveAcct?._id || "") },
      }),
  ]);

  const myRequests = ((myRequestsRes as any)?.data ?? []) as any[];
  const clientWorkItems = ((clientWorkItemsRes as any)?.data ?? []) as any[];
  const clientServices = ((clientServicesRes as any)?.data ?? []) as any[];
  const myDeliverables = ((myDeliverablesRes as any)?.data ?? []) as any[];
  const campaigns = ((activeCampaignRes as any)?.data ?? []) as any[];
  const contentItems = ((contentItemsRes as any)?.data ?? []) as any[];
  const analytics = ((analyticsRes as any)?.data ?? []) as any[];
  const myThreads = ((myThreadsRes as any)?.data ?? []) as any[];
  const activeCampaign = campaigns.find((c: any) => c.status === "active") || campaigns[0];

  return (
    <div className="container mx-auto px-4 py-8">
      {!canWrite ? (
        <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating ? "Impersonation mode: actions are read-only." : "Missing SANITY_API_WRITE_TOKEN: messaging updates are disabled."}
        </div>
      ) : null}

      <ClientView
        data={{
          user: { name, email: emailLower, id: acctId, avatar: (effectiveAcct as any)?.avatar },
          account: effectiveAcct,
          myRequests,
          supportStaff: [], // Not needed for overview anymore
          myThreads,
          clientWorkItems,
          clientServices,
          myServiceRequests: [], // Not needed for overview
          myDeliverables,
          activeCampaign,
          calendarEvents: [], // Not needed for overview
          contentItems,
          socialConnections: [], // Not needed for overview
          analytics,
        }}
        actions={{
          submitClientRequest,
        }}
        capabilities={{
          canWrite,
          canViewServices,
        }}
      />
    </div>
  );
}
