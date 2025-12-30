"use client";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const options = [
  { code: "en", label: "English" },
  { code: "zh-HK", label: "中文（粵語）" },
  { code: "zh-CN", label: "中文（普通话）" },
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
    <select
      aria-label="Language"
      value={current.code}
      onChange={(e) => setLanguage(e.target.value)}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-9 w-[140px] border-0 bg-transparent shadow-none hover:bg-muted/40"
      )}
    >
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
