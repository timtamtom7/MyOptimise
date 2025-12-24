"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

function isPlainLeftClick(event: MouseEvent) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return false;
  return true;
}

function getInternalHrefFromClickTarget(target: EventTarget | null) {
  const el = target instanceof Element ? target : null;
  if (!el) return null;
  const anchor = el.closest("a[href]");
  if (!anchor) return null;
  if (anchor.getAttribute("target") === "_blank") return null;
  if (anchor.hasAttribute("download")) return null;
  const href = anchor.getAttribute("href") || "";
  if (!href) return null;
  if (href.startsWith("#")) return null;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const url = new URL(href);
      if (url.origin !== window.location.origin) return null;
      return url.pathname + url.search + url.hash;
    } catch {
      return null;
    }
  }
  if (href.startsWith("/")) return href;
  return null;
}

export default function GlobalRouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setActive(false), 150);
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    };
  }, [pathname, searchParams, active]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isPlainLeftClick(event)) return;
      const href = getInternalHrefFromClickTarget(event.target);
      if (!href) return;
      setActive(true);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      setActive(true);
      return originalPushState.apply(this, args as any);
    };
    window.history.replaceState = function (...args) {
      setActive(true);
      return originalReplaceState.apply(this, args as any);
    };

    const onPopState = () => setActive(true);

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-3 z-50 flex justify-center px-4">
      <Card className="bg-card" style={{ backgroundColor: "var(--card)" }}>
        <CardContent className="flex items-center gap-2 p-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <span className="text-sm font-medium" style={{ color: "var(--primary)" }}>
            Loading…
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

