"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { Deliverable } from "./briefing-board"; // Re-use interface

interface ReviewQueueProps {
  deliverables: Deliverable[];
}

export function ReviewQueue({ deliverables }: ReviewQueueProps) {
  const reviewItems = deliverables.filter(d => d.status === "internal_review");

  if (reviewItems.length === 0) {
    return <EmptyState message="No items waiting for internal review." />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid gap-6">
        {reviewItems.map(item => (
          <ReviewCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ item }: { item: Deliverable }) {
  if (!item) return null;
  return (
    <Card className="border-l-4 border-l-amber-400">
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <h4 className="font-medium text-lg text-slate-900 mb-1">{item.title || "Untitled"}</h4>
          <p className="text-sm text-slate-500">Submitted by {item.assignedTo?.name || "Unknown"}</p>
        </div>
        <Link href={`/flow/manager/brief/${item._id}`} className={buttonVariants({ variant: "outline" })}>
          Review Now
        </Link>
      </CardContent>
    </Card>
  );
}

export function ClientQueue({ deliverables }: { deliverables: Deliverable[] }) {
  const clientItems = deliverables.filter(d => d.status === "client_review");

  return (
     <div className="max-w-6xl mx-auto">
       <div className="grid gap-6">
          {clientItems.map(item => (
              <ClientReviewCard key={item._id} item={item} />
          ))}
          {clientItems.length === 0 && <EmptyState message="No items currently with client." />}
       </div>
    </div>
  )
}


function ClientReviewCard({ item }: { item: Deliverable }) {
  if (!item) return null;
   return (
      <Card className="border-l-4 border-l-blue-400">
           <CardContent className="p-6 flex justify-between items-center">
              <div>
                  <h4 className="font-medium text-lg text-slate-900 mb-1">{item.title || "Untitled"}</h4>
                  <p className="text-sm text-slate-500">Waiting for Client Approval</p>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400">
                   <Share2 className="w-4 h-4 mr-2" /> Resend Link
              </Button>
           </CardContent>
      </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg">
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
