"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AssignEditorDialog } from "./assign-editor-dialog";

export interface Deliverable {
  _id: string;
  title: string;
  status: string;
  type: string;
  platform: string;
  dueDate?: string;
  assignedTo?: { name: string; avatar?: any };
  versionHistory?: any[];
  approvalToken?: string;
}

interface BriefingBoardProps {
  deliverables: Deliverable[];
}

export function BriefingBoard({ deliverables }: BriefingBoardProps) {
  const draftingItems = deliverables.filter(d => d.status === "drafting" || d.status === "assigned" || d.status === "changes_requested");
  const reviewItems = deliverables.filter(d => d.status === "internal_review");
  const clientItems = deliverables.filter(d => d.status === "client_review");
  const approvedItems = deliverables.filter(d => d.status === "approved" || d.status === "scheduled");

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <StatusSection title="In Production" items={draftingItems} />
      <StatusSection title="Internal Review" items={reviewItems} />
      <StatusSection title="With Client" items={clientItems} />
      <StatusSection title="Approved" items={approvedItems} />
    </div>
  );
}

function StatusSection({ title, items }: { title: string, items: Deliverable[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <BriefCard key={item._id} item={item} />
        ))}
      </div>
    </section>
  );
}

function BriefCard({ item }: { item: Deliverable }) {
  const router = useRouter();
  return (
    <div className="block group relative">
      <Link href={`/flow/manager/brief/${item._id}`} className="block h-full">
        <Card className="h-full hover:shadow-md transition-all duration-200 border-slate-200">
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="text-xs font-normal text-slate-500 border-slate-200">
                {item.platform} / {item.type}
              </Badge>
              {item.status === "internal_review" && (
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            <h4 className="font-medium text-slate-900 mt-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {item.title}
            </h4>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex justify-between items-center text-xs text-slate-500 mt-4">
              <div className="flex items-center" onClick={(e) => e.preventDefault()}>
                <AssignEditorDialog 
                  deliverableId={item._id} 
                  currentAssignee={item.assignedTo}
                  onAssignSuccess={() => router.refresh()}
                />
              </div>
              {item.dueDate && (
                <span className={cn(
                  "flex items-center",
                  new Date(item.dueDate) < new Date() ? "text-red-500" : ""
                )}>
                  {format(new Date(item.dueDate), "MMM d")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
