"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function GoogleSignInButton({
  callbackUrl,
  label = "Continue with Google",
}: {
  callbackUrl?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      onClick={() => {
        setLoading(true);
        signIn("google", { callbackUrl });
      }}
      className="w-full"
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" />
          Connecting to Google…
        </>
      ) : (
        label
      )}
    </Button>
  );
}
