import { safeGetServerSession } from "@/lib/auth";
import { fetchLeads } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";
import { PipelineBoard } from "@/components/dashboard/sales/pipeline-board";
import { hasCapability } from "@/lib/capabilities";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewLeadDialog } from "@/components/dashboard/sales/new-lead-dialog";

export default async function SalesPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  // Check capability
  if (!hasCapability(session.capabilities, "sales.access")) {
    redirect("/dashboard");
  }

  const leads = await fetchLeads();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground">Manage your deals and track progress.</p>
        </div>
        <NewLeadDialog />
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
         <PipelineBoard initialLeads={leads} />
      </div>
    </div>
  );
}
