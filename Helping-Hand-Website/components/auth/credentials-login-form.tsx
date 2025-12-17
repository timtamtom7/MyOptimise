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
            setError("Sign in failed. Check your credentials or approval status.");
            setLoading(false);
          } else if (res?.ok) {
            window.location.href = callbackUrl || "/dashboard";
          } else {
            setLoading(false);
          }
        }).catch(() => {
          setError("Sign in failed due to a server error.");
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
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
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
