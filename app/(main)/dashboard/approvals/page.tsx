import { fetchContentItems } from "@/sanity/lib/fetch";
import { ContentApprovals } from "@/components/dashboard/client/content-approvals";
import { approveContent, rejectContent } from "@/app/actions/content";

export const metadata = {
  title: "Approvals | Optimise",
};

export default async function ApprovalsPage() {
  const items = await fetchContentItems();
  
  return (
    <div className="h-full max-w-7xl mx-auto p-4 md:p-8">
      <ContentApprovals 
        items={items} 
        onApprove={approveContent} 
        onReject={rejectContent} 
      />
    </div>
  );
}
