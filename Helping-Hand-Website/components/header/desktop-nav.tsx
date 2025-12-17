"use client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAVIGATION_QUERYResult } from "@/sanity.types";
import { usePathname } from "next/navigation";

type SanityLink = NonNullable<NAVIGATION_QUERYResult[0]["links"]>[number];

export default function DesktopNav({
  navigation,
}: {
  navigation: NAVIGATION_QUERYResult;
}) {
  const pathname = usePathname();
  return (
    <div className="hidden xl:flex items-center gap-6 text-primary">
      {navigation[0]?.links?.map((navItem: SanityLink) => (
        <Link
          key={navItem._key}
          href={navItem.href || "#"}
          target={navItem.target ? "_blank" : undefined}
          rel={navItem.target ? "noopener noreferrer" : undefined}
          className={(() => {
            const href = navItem.href || "";
            const isActive = href && (pathname === href || pathname.startsWith(href));
            const base = buttonVariants({ variant: isActive ? "default" : "ghost", size: "sm" });
            return cn(base, "h-9 px-4");
          })()}
        >
          {navItem.title}
        </Link>
      ))}
    </div>
  );
}
