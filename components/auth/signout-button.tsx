"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

export default function SignOutButton({
  variant = "outline",
  size = "lg",
  triggerClassName,
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
}) {
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
          <div className="mt-6 flex gap-3">
            <Button
              className="flex-1"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign Out
            </Button>
            <Dialog.Close asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
