"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRICING_TIERS = [
  {
    category: "Video",
    items: [
      { name: "Reel / TikTok (Short Form)", price: "$50", desc: "Up to 60s, vertical format" },
      { name: "Video (Long Form)", price: "$120", desc: "Horizontal, up to 3 mins" },
      { name: "Story (Video)", price: "$25", desc: "Up to 15s, vertical" },
    ]
  },
  {
    category: "Static",
    items: [
      { name: "Carousel", price: "$40", desc: "Up to 10 slides" },
      { name: "Static Post", price: "$20", desc: "Single image + caption" },
      { name: "Story (Static)", price: "$15", desc: "Single image" },
    ]
  },
  {
    category: "Other",
    items: [
      { name: "Thumbnail", price: "$15", desc: "Custom YouTube thumbnail" },
      { name: "Resizing / Repurposing", price: "$10", desc: "Adapt existing content" },
    ]
  }
];

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Deliverable Pricing</DialogTitle>
          <DialogDescription>
            Standard rates for editor deliverables. Complex items may have custom pricing set in the brief.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-8">
          {PRICING_TIERS.map((tier) => (
            <div key={tier.category}>
              <h3 className="text-lg font-medium mb-3 text-slate-900 dark:text-slate-50">{tier.category}</h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-950">
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tier.items.map((item) => (
                      <TableRow key={item.name} className="border-t border-slate-100 dark:border-slate-800">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-slate-500">{item.desc}</TableCell>
                        <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                          {item.price}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
