"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect, useState } from "react";

const options = [
  { code: "en", label: "English" },
  { code: "zh-HK", label: "中文（粵語）" },
  { code: "zh-CN", label: "中文（普通话）" },
] as const;

export default function LanguageSelector() {
  const [lang, setLang] = useState<string>(() => {
    if (typeof document === "undefined") return "en";
    const m = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : "en";
  });
  const [userSelected, setUserSelected] = useState(false);
  function setLanguage(code: string) {
    setLang(code);
    setUserSelected(true);
  }
  useEffect(() => {
    if (!userSelected) return;
    document.cookie = `lang=${encodeURIComponent(lang)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }, [lang, userSelected]);
  const current = options.find((o) => o.code === lang) || options[0];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="rounded-md border px-3 py-2">{current.label}</button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="rounded-md border bg-background p-1 shadow-md">
        {options.map((o) => (
          <DropdownMenu.Item
            key={o.code}
            onSelect={() => setLanguage(o.code)}
            className="px-3 py-2 cursor-pointer hover:bg-muted"
          >
            {o.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
