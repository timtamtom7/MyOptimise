"use client";
import { signIn } from "next-auth/react";
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
  return (
    <Button
      onClick={() => {
        setLoading(true);
        signIn(
          "google",
          { callbackUrl },
          loginHint ? { login_hint: loginHint } : undefined
        );
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
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34.7 31.7 30.1 35 24 35c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.2l5.7-5.7C34.6 3.5 29.6 1.5 24 1.5 11.5 1.5 1.5 11.5 1.5 24S11.5 46.5 24 46.5c12.5 0 22.5-10 22.5-22.5 0-1.5-.2-2.9-.5-4.2z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.3 16.5 18.8 13 24 13c3.3 0 6.3 1.2 8.6 3.2l5.7-5.7C34.6 3.5 29.6 1.5 24 1.5 15.4 1.5 8.1 6.2 4.3 13.2z"/>
            <path fill="#4CAF50" d="M24 46.5c6 0 11.4-2.3 15.5-6l-6.9-5.7C30.1 35 26.7 36.5 24 36.5c-6.1 0-11.2-3.8-13.1-9.1l-6.7 5.2c3.7 7.2 11 11.9 19.8 11.9z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.7 3.7-5.2 6.5-9.3 6.5-6.1 0-11.2-3.8-13.1-9.1l-6.7 5.2C9.4 38.8 16.7 43.5 24 43.5c7.5 0 13.8-4.9 16.1-11.7.7-2.1 1.1-4.4 1.1-6.8 0-1.5-.2-2.9-.5-4.2z"/>
          </svg>
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
