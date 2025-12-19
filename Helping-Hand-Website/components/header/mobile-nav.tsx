"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import { useState } from "react";
import { AlignRight, CalendarDays, Building2, HandHeart } from "lucide-react";
import { SETTINGS_QUERYResult, NAVIGATION_QUERYResult } from "@/sanity.types";
import SignOutButton from "@/components/auth/signout-button";

type SanityLink = NonNullable<NAVIGATION_QUERYResult[0]["links"]>[number];

export default function MobileNav({
  navigation,
  settings,
  isAdmin = false,
  isLoggedIn = false,
}: {
  navigation: NAVIGATION_QUERYResult;
  settings: SETTINGS_QUERYResult;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label="Open Menu"
          variant="ghost"
          className="w-10 p-5 focus-visible:ring-1 focus-visible:ring-offset-1"
        >
          <AlignRight className="dark:text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="mx-0">
            <Logo settings={settings} />
          </div>
          <div className="sr-only">
            <SheetTitle>Main Navigation</SheetTitle>
            <SheetDescription>Navigate to the website pages</SheetDescription>
          </div>
        </SheetHeader>
        <div className="pt-10 pb-20">
          <div className="container">
            <ul className="list-none space-y-2">
              {navigation[0]?.links?.map((navItem: SanityLink) => (
                <li key={navItem._key} className="flex">
                  <Link
                    onClick={() => setOpen(false)}
                    href={navItem.href || "#"}
                    target={navItem.target ? "_blank" : undefined}
                    rel={navItem.target ? "noopener noreferrer" : undefined}
                    className={cn("w-full rounded-md px-3 py-2 hover:bg-accent/40 transition", "text-left flex items-center gap-3")}
                  >
                    {(() => {
                      const t = (navItem.title || "").toLowerCase();
                      if (t.includes("event")) return <CalendarDays className="w-5 h-5" />;
                      if (t.includes("organ")) return <Building2 className="w-5 h-5" />;
                      if (t.includes("sponsor")) return <HandHeart className="w-5 h-5" />;
                      return <AlignRight className="w-5 h-5" />;
                    })()}
                    <span className="text-lg">{navItem.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="container border-t pt-6">
          {isAdmin ? (
            <div className="grid gap-3">
              <Link
                onClick={() => setOpen(false)}
                href="/studio"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full justify-center"
                )}
              >
                Go to Content Management Studio
              </Link>
              <SignOutButton variant="outline" size="lg" triggerClassName="w-full justify-center" />
            </div>
          ) : isLoggedIn ? (
            <SignOutButton variant="outline" size="lg" triggerClassName="w-full justify-center" />
          ) : (
            <div className="grid gap-3">
              <Link
                onClick={() => setOpen(false)}
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full justify-center"
                )}
              >
                Sign In
              </Link>
              <Link
                onClick={() => setOpen(false)}
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full justify-center"
                )}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
