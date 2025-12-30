"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutButton({
  variant = "outline",
  size = "lg",
  triggerClassName,
  showLogoutAll = true,
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
  showLogoutAll?: boolean;
}) {
  const [busy, setBusy] = useState<null | "signout" | "logoutAll">(null);
  const [error, setError] = useState<string>("");

  async function handleLogoutAll() {
    if (busy) return;
    setError("");
    setBusy("logoutAll");
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST" });
      if (!res.ok) {
        setError("Couldn’t sign out everywhere. Please try again.");
        setBusy(null);
        return;
      }
      await signOut({ callbackUrl: "/login" });
    } catch {
      setError("Couldn’t sign out everywhere. Please try again.");
      setBusy(null);
    }
  }

  async function handleSignOut() {
    if (busy) return;
    setError("");
    setBusy("signout");
    await signOut({ callbackUrl: "/" });
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className={cn(buttonVariants({ variant, size }), "justify-center", triggerClassName)}
        >
          Sign Out
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 backdrop-blur-md bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
          <Dialog.Title className="text-xl font-semibold">Sign out</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to sign out?
          </Dialog.Description>
          {error ? (
            <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="mt-6 flex gap-3">
            <Button
              className="flex-1"
              onClick={handleSignOut}
              disabled={Boolean(busy)}
            >
              Sign Out
            </Button>
            <Dialog.Close asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </Dialog.Close>
          </div>
          {showLogoutAll ? (
            <div className="mt-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogoutAll}
                disabled={Boolean(busy)}
              >
                Sign out everywhere
              </Button>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
