"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ImpersonationBannerProps {
  originalUserEmail?: string;
}

export function ImpersonationBanner({ originalUserEmail }: ImpersonationBannerProps) {
  const router = useRouter();

  const handleStopImpersonating = async () => {
    try {
        await fetch("/api/auth/impersonate/stop", { method: "POST" });
        
        // Manual cookie cleanup to ensure client-side state is cleared
        document.cookie = "impersonateAccountId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "impersonateAccountId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
        
        // Use router.refresh() instead of window.location.href to avoid full page reload race conditions
        // and allow the server component to re-render with the restored session.
        router.refresh();
        router.push("/dashboard"); // Ensure we are on the dashboard
    } catch (error) {
        console.error("Failed to stop impersonating", error);
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-amber-600 dark:text-amber-400">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="h-4 w-4" />
        <span>
          Viewing as impersonated user
          {originalUserEmail && <span className="hidden sm:inline"> (Signed in as {originalUserEmail})</span>}
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleStopImpersonating}
        className="h-8 hover:bg-amber-500/20 hover:text-amber-700 dark:hover:text-amber-300"
      >
        <span className="flex items-center gap-2">
          Exit Impersonation
          <X className="h-4 w-4" />
        </span>
      </Button>
    </div>
  );
}
