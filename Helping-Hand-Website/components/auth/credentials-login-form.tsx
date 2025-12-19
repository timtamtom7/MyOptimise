"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function CredentialsLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [email, setEmail] = useState("");
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
          email,
          password,
          callbackUrl,
          redirect: false,
        }).then((res) => {
          if (res?.error) {
            setError("Sign in failed. Your account may be pending approval or credentials are incorrect.");
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
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="rounded-md border px-3 py-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        className="rounded-md border px-3 py-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <>
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
          {showErrorModal && (
            <>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-40" />
              <div className="fixed z-50 left-1/2 top-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
                <div className="text-xl font-semibold">Sign in blocked</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Your account is pending approval or the credentials are invalid. Try again later or contact support.
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setShowErrorModal(false)} className="rounded-md bg-primary px-4 py-2 text-primary-foreground flex-1">
                    Close
                  </button>
                  <a href="/signup" className="rounded-md border px-4 py-2 flex-1 text-center">Create account</a>
                </div>
              </div>
            </>
          )}
        </>
      )}
      <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            Signing In…
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
