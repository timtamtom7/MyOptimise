import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { ContentGrid } from "@/components/dashboard/client/content-grid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientContentPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const acct = await fetchSanityAccountByEmail({ email });
  
  if (!acct || acct.status === "disabled" || acct.type !== "client") {
    redirect("/dashboard");
  }

  const acctId = String(acct._id);
  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN);

  const { data: contentItems } = await sanityFetch({
    query: `*[_type == "contentItem" && client._ref == $acctId]{
        _id, title, caption, scheduledAt, status, platform, postType,
        "firstAssetUrl": media[0].asset->url,
        "firstAssetMime": media[0].asset->mimeType,
        annotations
      }`,
    params: { acctId },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">Manage and review your social media content.</p>
        </div>
        {/* Create Post Dialog Trigger would go here, managed by a client wrapper if needed */}
      </div>
      <ContentGrid 
        items={(contentItems as any[]) || []} 
        onPostClick={() => {}} // Handled by client component internal state or wrapper
        capabilities={{ canWrite, canViewServices: true }}
      />
    </div>
  );
}
