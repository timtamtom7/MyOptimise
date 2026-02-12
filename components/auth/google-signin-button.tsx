"use client";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function GoogleSignInButton({
  callbackUrl,
  label = "Continue with Google",
  loginHint,
}: {
  callbackUrl?: string;
  label?: string;
  loginHint?: string;
}) {
  const [loading, setLoading] = useState(false);
  
  const handleSignIn = async () => {
    try {
      setLoading(true);
      console.log("Initiating Google sign-in...");
      
      // Use default redirect behavior for better reliability with OAuth
      await signIn("google", { 
        callbackUrl: callbackUrl || "/",
      }, loginHint ? { login_hint: loginHint } : undefined);
      
      // The page will redirect, so we don't need to handle the result
      // But if it returns (e.g. error), we can catch it
    } catch (error) {
      console.error("Sign-in error:", error);
      toast.error("Sign-in exception: " + String(error));
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleSignIn}
      className="w-full rounded-full h-14 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-medium border border-blue-600 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="animate-spin h-5 w-5" />
          Connecting...
        </span>
      ) : (
        <span className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width="24"
            height="24"
            aria-hidden="true"
          >
            <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
            <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
            <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.44 2 24c0 3.56.85 6.91 2.34 9.88l7.35-5.7z" />
            <path fill="#EA4335" d="M24 9.5c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.48 29.93 0 24 0 15.4 0 7.96 4.93 4.34 12.18l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
          </svg>
          <span>{label}</span>
        </span>
      )}
    </Button>
  );
}
