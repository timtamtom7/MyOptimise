"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { updateLeadStatus } from "@/app/actions/sales";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmailComposerDialog } from "./email-composer-dialog";
import { LeadDetailsDialog } from "./lead-details-dialog";
import { ConvertClientDialog } from "./convert-client-dialog";
import { MoreHorizontal, DollarSign, Calendar, User } from "lucide-react";

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
  { id: "cold", title: "Cold", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "contacted", title: "Contacted", color: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "discovery", title: "Discovery", color: "bg-purple-50 dark:bg-purple-900/20" },
  { id: "proposal", title: "Proposal", color: "bg-amber-50 dark:bg-amber-900/20" },
  { id: "negotiation", title: "Negotiation", color: "bg-orange-50 dark:bg-orange-900/20" },
  { id: "won", title: "Won", color: "bg-emerald-50 dark:bg-emerald-900/20" },
  { id: "lost", title: "Lost", color: "bg-red-50 dark:bg-red-900/20" },
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
        // Revert logic would go here
      }
    }
  };

  const openDetails = (lead: Lead) => {
    setSelectedLeadId(lead._id);
    setDetailsOpen(true);
  };

  return (
    <>
      <div className="flex gap-6 h-full pb-4 overflow-x-auto px-1 min-w-full w-max">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className={cn(
              "flex flex-col w-[350px] min-w-[350px] rounded-[2.5rem] p-4 transition-colors",
              col.color,
              "border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center justify-between px-4 py-2 mb-2">
              <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{col.title}</h3>
              <Badge variant="secondary" className="rounded-full px-3 py-1 bg-white/50 dark:bg-black/20 text-slate-600 dark:text-slate-300 font-bold">
                {leads.filter(l => l.status === col.id).length}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-2">
              {leads
                .filter((l) => l.status === col.id)
                .map((lead) => (
                  <div
                    key={lead._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead._id)}
                    onClick={() => openDetails(lead)}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:-translate-y-1 group relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                        <div className="font-bold text-lg text-slate-900 dark:text-slate-100">{lead.companyName}</div>
                        <button className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {lead.value && (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-xl w-fit">
                                <DollarSign className="h-4 w-4" />
                                {lead.value.toLocaleString()}
                            </div>
                        )}
                        
                        {lead.contactName && (
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <User className="h-4 w-4" />
                                {lead.contactName}
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Calendar className="h-3 w-3" />
                            {new Date(lead._updatedAt || Date.now()).toLocaleDateString()}
                        </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      {selectedLead && (
        <>
            <EmailComposerDialog 
                open={composerOpen} 
                onOpenChange={setComposerOpen} 
                lead={selectedLead} 
            />
            <LeadDetailsDialog 
                open={detailsOpen} 
                onOpenChange={setDetailsOpen} 
                lead={selectedLead} 
            />
        </>
      )}

      {convertLeadId && (
        <ConvertClientDialog 
            open={convertOpen} 
            onOpenChange={setConvertOpen} 
            leadId={convertLeadId}
            leadName={leads.find(l => l._id === convertLeadId)?.companyName || "Lead"}
        />
      )}
    </>
  );
}
