import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { RequestsList } from "@/components/dashboard/client/requests-list";
import { addClientRequestMessage, submitClientRequest } from "@/app/actions/client";

export const dynamic = "force-dynamic";

export default async function ClientRequestsPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const acct = await fetchSanityAccountByEmail({ email });
  
  if (!acct || acct.status === "disabled" || acct.type !== "client") {
    redirect("/dashboard");
  }

  const acctId = String(acct._id);
  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN);

  const { data: myRequests } = await sanityFetch({
    query: `*[_type == "clientRequest" && clientEmail != null && lower(clientEmail) == $email] | order(createdAt desc)[0..9]{
        _id, subject, status, createdAt, response, category, priority,
        statusHistory[]{fromStatus, toStatus, changedAt},
        messages[visibility == "client"]{
          message, createdAt, visibility,
          author->{name, email},
          attachments[]{asset->{url, originalFilename}}
        }
      }`,
    params: { email: email.toLowerCase() },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Requests</h1>
          <p className="text-muted-foreground">Track and manage your support tickets.</p>
        </div>
      </div>
      <RequestsList 
        requests={(myRequests as any[]) || []}
        canWrite={canWrite}
        addMessageAction={addClientRequestMessage}
        submitRequestAction={submitClientRequest}
      />
    </div>
  );
}
