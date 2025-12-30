"use client";

import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { SETTINGS_QUERYResult } from "@/sanity.types";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Logo({
  settings,
  className,
}: {
  settings: SETTINGS_QUERYResult;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const themeToUse = mounted ? resolvedTheme || "light" : "light";

  const preferredKey = themeToUse === "dark" ? "dark" : "light";
  const fallbackKey = themeToUse === "dark" ? "light" : "dark";
  const selectedLogo = settings?.logo?.[preferredKey];
  const fallbackLogo = settings?.logo?.[fallbackKey];
  const logoToUse = selectedLogo || fallbackLogo;
  const siteName = settings?.siteName || "Optimise Operations";

  return logoToUse ? (
    <Image
      src={urlFor(logoToUse).url()}
      alt={siteName}
      width={
        settings?.logo?.width ??
        logoToUse?.asset?.metadata?.dimensions?.width ??
        100
      }
      height={
        settings?.logo?.height ??
        logoToUse?.asset?.metadata?.dimensions?.height ??
        40
      }
      className={cn("h-auto w-auto", className)}
      title={siteName}
      placeholder={
        logoToUse?.asset?.metadata?.lqip &&
        logoToUse?.asset?.mimeType !== "image/svg+xml"
          ? "blur"
        : undefined
      }
      blurDataURL={logoToUse?.asset?.metadata?.lqip || undefined}
      quality={100}
      priority
    />
  ) : (
    <span className="text-lg font-semibold tracking-tighter text-[color:var(--primary)]">
      {siteName}
    </span>
  );
}
