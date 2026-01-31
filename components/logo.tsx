"use client";

import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { SETTINGS_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";

export default function Logo({
  settings,
  className,
}: {
  settings: SETTINGS_QUERYResult;
  className?: string;
}) {
  const siteName = settings?.siteName || "Optimise Operations";
  const logo = settings?.logo;
  
  // Prepare URLs for both variants
  const lightUrl = logo?.light ? urlFor(logo.light).width(400).url() : null;
  const darkUrl = logo?.dark ? urlFor(logo.dark).width(400).url() : null;
  
  // Fallback: if one is missing, use the other for both modes
  const effectiveLightUrl = lightUrl || darkUrl;
  const effectiveDarkUrl = darkUrl || lightUrl;

  const hasLogo = !!effectiveLightUrl;

  return (
    <div className={cn("flex items-center shrink-0 relative", className)}>
      {hasLogo ? (
        <>
          {/* Light Mode Logo - hidden in dark mode */}
          <Image
            src={effectiveLightUrl!}
            alt={siteName}
            width={150}
            height={40}
            className="h-full w-auto object-contain dark:hidden"
            priority
            suppressHydrationWarning
          />
          {/* Dark Mode Logo - hidden in light mode */}
          <Image
            src={effectiveDarkUrl!}
            alt={siteName}
            width={150}
            height={40}
            className="h-full w-auto object-contain hidden dark:block"
            priority
            suppressHydrationWarning
          />
        </>
      ) : (
        <span className="text-lg font-semibold tracking-tighter text-[color:var(--primary)]">
          {siteName}
        </span>
      )}
    </div>
  );
}
