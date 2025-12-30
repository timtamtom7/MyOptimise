"use client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAVIGATION_QUERYResult } from "@/sanity.types";
import { usePathname } from "next/navigation";

type SanityLink = NonNullable<NAVIGATION_QUERYResult[0]["links"]>[number] & {
  target?: boolean | null;
};

export default function DesktopNav({
  navigation,
}: {
  navigation: NAVIGATION_QUERYResult;
}) {
  const pathname = usePathname();
  return (
    <div className="hidden xl:flex items-center gap-3">
      {navigation[0]?.links?.map((navItem: SanityLink) => (
        <Link
          key={navItem._key}
          href={navItem.href || "#"}
          target={navItem.target ? "_blank" : undefined}
          rel={navItem.target ? "noopener noreferrer" : undefined}
          className={(() => {
            const href = navItem.href || "";
            const isActive = href && (pathname === href || pathname.startsWith(href));
            return cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 px-5 rounded-[33px] border-0 bg-transparent font-semibold text-[color:var(--primary)] hover:bg-muted/40 shadow-none",
              isActive
                ? "bg-muted text-[color:var(--primary)] hover:bg-muted/60"
                : undefined
            );
          })()}
        >
          {navItem.title}
        </Link>
      ))}
    </div>
  );
}
