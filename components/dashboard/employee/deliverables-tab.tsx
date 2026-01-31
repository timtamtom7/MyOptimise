"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateDeliverableDialog } from "./create-deliverable-dialog";
import { formatDate } from "@/lib/date-formatting";

interface DeliverablesTabProps {
  clientId: string;
  deliverables: any[];
  activeCampaigns: any[];
  brandAssets?: any[];
}

export function DeliverablesTab({ clientId, deliverables, activeCampaigns, brandAssets }: DeliverablesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Deliverables</h2>
        <CreateDeliverableDialog 
          clientId={clientId} 
          activeCampaigns={activeCampaigns} 
          brandAssets={brandAssets}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliverables.length === 0 && <p className="text-muted-foreground">No deliverables found.</p>}
            {deliverables.map((d) => (
              <div key={d._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{d.title}</p>
                    <Badge variant="outline">{d.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.campaignTitle} • Due {d.dueDate ? formatDate(d.dueDate) : "No date"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {d.assignedTo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <span>{d.assignedTo.name}</span>
                    </div>
                  )}
                  <Badge 
                    className={
                      d.status === 'approved' ? 'bg-green-500' : 
                      d.status === 'client_review' ? 'bg-blue-500' : 
                      d.status === 'internal_review' ? 'bg-blue-600' :
                      d.status === 'changes_requested' ? 'bg-orange-500' :
                      'bg-slate-500'
                    }
                  >
                    {d.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
