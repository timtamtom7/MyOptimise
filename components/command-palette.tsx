"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CommandPaletteCommand =
  | {
      id: string;
      label: string;
      kind: "link";
      href: string;
      keywords?: string;
    }
  | {
      id: string;
      label: string;
      kind: "logout_all";
      keywords?: string;
    };

function normalizeQuery(input: string): string {
  return input.trim().toLowerCase();
}

export default function CommandPalette(props: {
  enabled: boolean;
  commands: CommandPaletteCommand[];
}) {
  const { enabled, commands } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPalette = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = `${c.label} ${c.keywords || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query]);

  const runCommand = useCallback(
    async (cmd: CommandPaletteCommand) => {
      if (cmd.kind === "link") {
        setOpen(false);
        router.push(cmd.href);
        return;
      }
      if (cmd.kind === "logout_all") {
        setOpen(false);
        try {
          await fetch("/api/auth/logout-all", { method: "POST" });
        } catch {}
        window.location.href = "/login";
      }
    },
    [router]
  );

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isModifier = event.metaKey || event.ctrlKey;
      if (isModifier && key === "k") {
        event.preventDefault();
        if (open) closePalette();
        else openPalette();
        return;
      }
      if (!open) return;
      if (key === "escape") {
        event.preventDefault();
        closePalette();
        return;
      }
      if (key === "arrowdown") {
        event.preventDefault();
        setActiveIndex((v) => Math.min(v + 1, Math.max(filtered.length - 1, 0)));
        return;
      }
      if (key === "arrowup") {
        event.preventDefault();
        setActiveIndex((v) => Math.max(v - 1, 0));
        return;
      }
      if (key === "enter") {
        event.preventDefault();
        const cmd = filtered[activeIndex];
        if (cmd) void runCommand(cmd);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, open, filtered, activeIndex, runCommand, openPalette, closePalette]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!enabled) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={closePalette}
      />
      <div className="absolute left-1/2 top-[12vh] w-[min(720px,calc(100vw-2rem))] -translate-x-1/2">
        <div className={cn("rounded-xl border bg-card shadow-xl", open ? "opacity-100" : "opacity-0")}>
          <div className="border-b p-3">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search…"
              onKeyDown={(e) => {
                if (e.key === "Tab") e.preventDefault();
              }}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <div>⌘K / Ctrl+K</div>
              <div>{filtered.length} results</div>
            </div>
          </div>
          <div className="max-h-[52vh] overflow-auto p-2">
            {filtered.length ? (
              <div className="grid gap-1">
                {filtered.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    type="button"
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm transition",
                      idx === activeIndex ? "bg-muted" : "hover:bg-muted/60"
                    )}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => void runCommand(cmd)}
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">No matches.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
