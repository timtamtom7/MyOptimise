"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateLeadStatus } from "@/app/actions/sales";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmailComposerDialog } from "./email-composer-dialog";
import { LeadDetailsDialog } from "./lead-details-dialog";
import { ConvertClientDialog } from "./convert-client-dialog";

interface Lead {
  _id: string;
  companyName: string;
  contactName?: string;
  status: string;
  value?: number;
  notes?: string;
  _updatedAt?: string;
}

interface PipelineBoardProps {
  initialLeads: Lead[];
}

const COLUMNS = [
  { id: "cold", title: "Cold" },
  { id: "contacted", title: "Contacted" },
  { id: "discovery", title: "Discovery Call" },
  { id: "proposal", title: "Proposal Sent" },
  { id: "negotiation", title: "Negotiation" },
  { id: "won", title: "Won" },
  { id: "lost", title: "Lost" },
];

export function PipelineBoard({ initialLeads }: PipelineBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const selectedLead = leads.find(l => l._id === selectedLeadId) || null;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    
    if (id && id === draggedId) {
      if (status === "won") {
        setConvertLeadId(id);
        setConvertOpen(true);
        setDraggedId(null);
        return;
      }

      // Optimistic update
      setLeads(prev => prev.map(l => l._id === id ? { ...l, status, _updatedAt: new Date().toISOString() } : l));
      setDraggedId(null);

      // Automation Triggers
      if (status === "contacted") {
        const lead = leads.find(l => l._id === id);
        if (lead) {
           setSelectedLeadId(id);
           setComposerOpen(true);
        }
      }
      
      if (status === "proposal") {
          toast.success("Proposal PDF generated", {
              description: "Link copied to clipboard: https://optimise.agency/p/" + id.slice(0, 8)
          });
      }

      try {
        await updateLeadStatus(id, status);
        toast.success(`Moved to ${COLUMNS.find(c => c.id === status)?.title}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to move lead");
        // Revert? In a real app we might revert state here.
      }
    }
  };

  const isStale = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 7;
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4 items-start">
      {COLUMNS.map(col => (
        <div 
          key={col.id} 
          className="min-w-[280px] w-[300px] bg-muted/30 rounded-xl p-3 flex flex-col max-h-full border border-transparent hover:border-border/50 transition-colors"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className="font-semibold mb-3 px-1 flex justify-between items-center text-sm">
             <span className="uppercase tracking-wider text-muted-foreground text-xs font-bold">{col.title}</span>
             <Badge variant="outline" className="text-xs bg-background">
               {leads.filter(l => l.status === col.id).length}
             </Badge>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto min-h-[100px]">
            {leads.filter(l => l.status === col.id).map(lead => (
              <Card 
                key={lead._id} 
                className={cn(
                  "cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
                  draggedId === lead._id && "opacity-50 rotate-2",
                  isStale(lead._updatedAt) && "border-red-200 bg-red-50/50"
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, lead._id)}
                onClick={() => {
                  setSelectedLeadId(lead._id);
                  setDetailsOpen(true);
                }}
              >
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-sm font-semibold">{lead.companyName}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1 text-xs text-muted-foreground">
                  <div className="line-clamp-1">{lead.contactName || "No contact"}</div>
                  {lead.value && (
                    <div className="mt-2 font-medium text-foreground bg-green-500/10 text-green-600 w-fit px-1.5 py-0.5 rounded">
                      ${lead.value.toLocaleString()}
                    </div>
                  )}
                  {lead._updatedAt && (
                     <div className="mt-2 text-[10px] text-muted-foreground/50">
                        Last update: {new Date(lead._updatedAt).toLocaleDateString()}
                     </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {leads.filter(l => l.status === col.id).length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground/30 italic py-8 border-2 border-dashed border-muted-foreground/10 rounded-lg">
                    Empty
                </div>
            )}
          </div>
        </div>
      ))}
      <EmailComposerDialog 
        lead={selectedLead} 
        open={composerOpen} 
        onOpenChange={setComposerOpen} 
      />
      <LeadDetailsDialog 
        lead={selectedLead} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />
      <ConvertClientDialog 
        lead={leads.find(l => l._id === convertLeadId) || null} 
        open={convertOpen} 
        onOpenChange={setConvertOpen}
        onSuccess={(id) => {
          setLeads(prev => prev.map(l => l._id === id ? { ...l, status: "won", _updatedAt: new Date().toISOString() } : l));
        }}
      />
    </div>
  );
}
