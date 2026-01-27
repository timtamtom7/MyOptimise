import { verifyApprovalToken } from "@/app/actions/deliverables";
import { DeliverableApprovalView } from "@/components/dashboard/client/deliverable-approval-view";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyApprovalToken(token);
  
  if (!result.success || !result.deliverable) {
    return notFound();
  }

  const { deliverable } = result;

  return (
    <div className="min-h-screen bg-gray-50/50">
        <header className="bg-white border-b px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
             <div className="flex items-center gap-2">
                 <span className="font-display text-xl font-bold">Optimise.</span>
             </div>
             {deliverable.campaign?.client && (
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="hidden sm:inline">for </span>
                    <span className="font-medium text-foreground">{deliverable.campaign.client.name}</span>
                 </div>
             )}
        </header>
        <main className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{deliverable.title}</h1>
                <p className="text-muted-foreground">
                    {deliverable.campaign?.title} • {new Date(deliverable.dueDate || new Date()).getFullYear()}
                </p>
            </div>
            
            <DeliverableApprovalView 
                deliverable={deliverable} 
                token={token} 
            />
        </main>
    </div>
  );
}
