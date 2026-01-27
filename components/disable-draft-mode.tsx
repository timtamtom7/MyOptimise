"use client";
import { Button } from "./ui/button";
import Link from "next/link";

export function DisableDraftMode() {
  return (
    <Button asChild>
      <Link href="/api/draft-mode/disable" className="fixed bottom-4 right-4">
        Disable Draft Mode
      </Link>
    </Button>
  );
}
