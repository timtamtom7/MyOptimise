"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalLoadingCursor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const stopFetchingTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigationSafetyTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isNavigating || isMutating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setIsMutating(false);
      }, 100); 
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isNavigating, isMutating]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || !anchor.href) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);
        if (targetUrl.origin !== currentUrl.origin) return;
        if (targetUrl.href === currentUrl.href) return;

        setIsNavigating(true);
        
        if (navigationSafetyTimeout.current) clearTimeout(navigationSafetyTimeout.current);
        navigationSafetyTimeout.current = setTimeout(() => {
          setIsNavigating(false);
        }, 15000);
      } catch (err) { }
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const patchHistory = (original: typeof window.history.pushState) => {
      return function (data: any, unused: string, url?: string | URL | null) {
        // Defer state update to avoid "useInsertionEffect must not schedule updates" error
        requestAnimationFrame(() => {
          setIsMutating(true);
          if (navigationSafetyTimeout.current) clearTimeout(navigationSafetyTimeout.current);
          navigationSafetyTimeout.current = setTimeout(() => {
            setIsMutating(false);
          }, 5000);
        });
        return original.call(window.history, data, unused, url);
      };
    };

    window.history.pushState = patchHistory(originalPushState);
    window.history.replaceState = patchHistory(originalReplaceState);

    const originalFetch = window.fetch;
    let activeFetches = 0;

    const patchedFetch = async (...args: Parameters<typeof fetch>) => {
      // Filter out Sanity Live and HMR requests from triggering the loading state
      const url = args[0]?.toString() || "";
      const isIgnored = 
        url.includes("api.sanity.io") || 
        url.includes("hot-reloader") ||
        url.includes("_next/static") ||
        url.includes("_next/image");

      if (!isIgnored) {
        activeFetches++;
        if (stopFetchingTimeout.current) {
          clearTimeout(stopFetchingTimeout.current);
          stopFetchingTimeout.current = null;
        }
        setIsFetching(true);
      }

      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error: any) {
        // Suppress abort errors from Sanity Live/HMR
        if (error.name === 'AbortError' && isIgnored) {
          // console.debug("Suppressed aborted fetch:", url);
          throw error; // Rethrow but we know it's handled
        }
        throw error;
      } finally {
        if (!isIgnored) {
          activeFetches--;
          if (activeFetches <= 0) {
            activeFetches = 0;
            stopFetchingTimeout.current = setTimeout(() => {
              setIsFetching(false);
            }, 300);
          }
        }
      }
    };

    window.fetch = patchedFetch;
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.fetch = originalFetch;
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      if (stopFetchingTimeout.current) clearTimeout(stopFetchingTimeout.current);
      if (navigationSafetyTimeout.current) clearTimeout(navigationSafetyTimeout.current);
    };
  }, []);

  const isLoading = isNavigating || isFetching || isMutating;

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent overflow-hidden pointer-events-none">
       <div className="h-full bg-primary animate-progress origin-left-right shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
    </div>
  );
}
