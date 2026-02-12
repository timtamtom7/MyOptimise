"use client";

import { stopImpersonation } from "@/app/actions/manager";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

export function StopImpersonationButton() {
  const [loading, setLoading] = useState(false);

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopImpersonation();
      // Force a hard reload to ensure cookies are cleared from the browser session context
      window.location.href = "/dashboard/admin";
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleStop} 
      variant="destructive" 
      size="sm"
      className="gap-2 shadow-sm"
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      Exit Impersonation
    </Button>
  );
}
