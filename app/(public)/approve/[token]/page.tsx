import { verifyApprovalToken, approveContentPublic, rejectContentPublic } from "@/app/actions/content";
import { ContentApprovals } from "@/components/dashboard/client/content-approvals";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const item = await verifyApprovalToken(token);
  
  if (!item) {
    return notFound();
  }

  async function onApprove(id: string, comment?: string) {
    "use server";
    await approveContentPublic(id, token, comment);
  }

  async function onReject(id: string, comment: string) {
    "use server";
    await rejectContentPublic(id, token, comment);
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
        <header className="bg-white border-b px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
             <div className="flex items-center gap-2">
                 <span className="font-display text-xl font-bold">Optimise.</span>
             </div>
             {item.client && (
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="hidden sm:inline">for </span>
                    <span>{item.client.name}</span>
                 </div>
             )}
        </header>
        <main className="container mx-auto py-4 md:py-8 px-4 max-w-6xl">
            <ContentApprovals 
                items={[item]} 
                onApprove={onApprove} 
                onReject={onReject} 
            />
        </main>
    </div>
  );
}
