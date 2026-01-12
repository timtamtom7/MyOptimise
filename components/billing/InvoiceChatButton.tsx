"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { getOrCreateThreadForDocument } from "@/app/actions/messages";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface InvoiceChatButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
}

export function InvoiceChatButton({ invoiceId, invoiceNumber, clientId }: InvoiceChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    try {
      setLoading(true);
      const threadId = await getOrCreateThreadForDocument(
        invoiceId,
        "invoice",
        `Invoice #${invoiceNumber}`,
        clientId
      );
      
      if (threadId) {
        router.push(`/dashboard/client/messages/${threadId}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleChat} 
      disabled={loading}
      title="Discuss Invoice"
    >
      <MessageSquare className="h-4 w-4" />
      <span className="sr-only">Discuss Invoice</span>
    </Button>
  );
}
