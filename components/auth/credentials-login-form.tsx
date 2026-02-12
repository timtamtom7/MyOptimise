"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function CredentialsLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        signIn("credentials", {
          password,
          callbackUrl,
          redirect: false,
        }).then((res) => {
          if (res?.error) {
            setError("Sign in failed. Invalid password.");
            setShowErrorModal(true);
            setLoading(false);
          } else if (res?.ok) {
            window.location.href = callbackUrl || "/";
          } else {
            setLoading(false);
          }
        }).catch(() => {
          setError("Sign in failed due to a server error.");
          setShowErrorModal(true);
          setLoading(false);
        });
      }}
      className="grid gap-4"
    >
      <div className="space-y-4">
        <div className="relative group">
          <input
            name="password"
            type="password"
            placeholder="Unique Password"
            className="block w-full h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-none px-6 text-lg font-medium text-center placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 shadow-inner"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end px-2">
          <Link 
            href="/forgot-password" 
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            Forgot unique password?
          </Link>
        </div>
      </div>

      {error && (
        <>
          <div className="rounded-2xl border-none bg-red-50 dark:bg-red-900/20 px-4 py-3 text-center text-sm font-medium text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
          {showErrorModal && (
            <>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 animate-in fade-in duration-300" />
              <div className="fixed z-50 left-1/2 top-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border-none bg-white dark:bg-slate-900 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-2xl font-bold text-center mb-2">Access Denied</div>
                <div className="text-center text-slate-500 mb-8 leading-relaxed">
                  The password you entered is incorrect. Please try again.
                </div>
                <button 
                  onClick={() => setShowErrorModal(false)} 
                  className="w-full h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </>
      )}

      <Button 
        type="submit" 
        className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300" 
        disabled={loading} 
        aria-busy={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5" />
            <span>Verifying...</span>
          </span>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
