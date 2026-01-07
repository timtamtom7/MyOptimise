"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateInvoiceStatus } from "@/app/actions/finance";
import { MoreHorizontal, Send, CheckCircle, Ban } from "lucide-react";
import { toast } from "sonner";

interface InvoiceActionsProps {
  invoiceId: string;
  currentStatus: string;
}

export function InvoiceActions({ invoiceId, currentStatus }: InvoiceActionsProps) {
  async function handleStatusChange(status: string) {
    const formData = new FormData();
    formData.append("invoiceId", invoiceId);
    formData.append("status", status);

    try {
      await updateInvoiceStatus(formData);
      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update invoice");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus === "draft" && (
          <DropdownMenuItem onClick={() => handleStatusChange("sent")}>
            <Send className="mr-2 h-4 w-4" />
            Mark as Sent
          </DropdownMenuItem>
        )}
        {currentStatus !== "paid" && (
          <DropdownMenuItem onClick={() => handleStatusChange("paid")}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Paid
          </DropdownMenuItem>
        )}
        {currentStatus !== "void" && (
          <DropdownMenuItem onClick={() => handleStatusChange("void")}>
            <Ban className="mr-2 h-4 w-4" />
            Void
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
