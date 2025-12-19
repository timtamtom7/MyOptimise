"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

export default function Segmented({
  options,
  param = "filter",
  className,
}: {
  options: Option[];
  param?: string;
  className?: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const current = search.get(param) ?? options[0]?.value;

  return (
    <div className={cn("inline-flex rounded-lg border bg-muted p-1", className)}>
      {options.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => {
              const sp = new URLSearchParams(search.toString());
              if (opt.value === options[0].value) {
                sp.delete(param);
              } else {
                sp.set(param, opt.value);
              }
              router.push(`?${sp.toString()}`);
            }}
            className={cn(
              "px-3 py-1 text-sm rounded-md",
              active ? "bg-background shadow" : "opacity-70 hover:opacity-100"
            )}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

