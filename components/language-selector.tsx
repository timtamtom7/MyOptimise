"use client";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const options = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "zh-HK", label: "中文（粵語）", flag: "🇭🇰" },
  { code: "zh-CN", label: "中文（普通话）", flag: "🇨🇳" },
] as const;

export default function LanguageSelector({ initialLang }: { initialLang?: string }) {
  const [lang, setLang] = useState<string>(() => initialLang || "en");
  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    const cookieLang = m?.[1] ? decodeURIComponent(m[1]) : "";
    if (cookieLang && cookieLang !== lang) {
      setLang(cookieLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setLanguage(nextLang: string) {
    const url = new URL(window.location.href);
    const returnTo = `${url.pathname}${url.search}${url.hash}`;
    window.location.href = `/api/i18n/apply?lang=${encodeURIComponent(nextLang)}&returnTo=${encodeURIComponent(returnTo)}`;
  }
  const current = options.find((o) => o.code === lang) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-9 px-2 border-0 bg-transparent shadow-none hover:bg-muted/40 gap-2 min-w-[40px]"
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg leading-none">{current.flag}</span>
          <span className="text-sm font-medium uppercase text-muted-foreground">{current.code.substring(0, 2)}</span>
          <span className="sr-only">{current.label}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.code}
            onClick={() => setLanguage(o.code)}
            className="gap-2 cursor-pointer"
          >
            <span className="text-lg leading-none">{o.flag}</span>
            <span>{o.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
