"use client";

import { AlertTriangle, X, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopImpersonation } from "@/app/actions/manager";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImpersonationBannerProps {
  originalUserEmail?: string;
}

export function ImpersonationBanner({ originalUserEmail }: ImpersonationBannerProps) {
  const [loading, setLoading] = useState(false);

  const handleStopImpersonating = async () => {
    setLoading(true);
    try {
        await stopImpersonation();
        
        // Manual cookie cleanup to ensure client-side state is cleared (backup)
        document.cookie = "impersonateAccountId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "impersonateAccountId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
        
        // Force a hard reload to ensure all state is cleared
        window.location.href = "/dashboard/admin";
    } catch (error) {
        console.error("Failed to stop impersonating", error);
        setLoading(false);
        // Fallback reload
        window.location.href = "/dashboard/admin";
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className={cn(
        "flex items-center gap-3 pl-4 pr-1 py-1.5 rounded-full shadow-2xl backdrop-blur-xl border",
        "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
      )}>
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </div>
          <span className="text-sm font-medium whitespace-nowrap">
            Viewing as <span className="font-bold">Impersonated User</span>
          </span>
          {originalUserEmail && (
             <span className="hidden sm:inline text-xs opacity-70 border-l border-blue-500/20 pl-2 ml-1">
               Signed in as {originalUserEmail}
             </span>
          )}
        </div>

        <Button 
          onClick={handleStopImpersonating}
          disabled={loading}
          size="sm"
          className={cn(
            "rounded-full h-8 px-4 text-xs font-semibold tracking-wide ml-2 transition-all",
            "bg-blue-500 text-white hover:bg-blue-600 border-none shadow-lg shadow-blue-500/20"
          )}
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
            ) : (
                <X className="h-3 w-3 mr-1.5" />
            )}
            Exit
        </Button>
      </div>
    </div>
  );
}
