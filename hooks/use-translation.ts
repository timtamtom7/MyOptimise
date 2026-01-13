"use client";

import { useState, useEffect } from "react";
import { dictionaries, Locale } from "@/lib/i18n";

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    const cookieLang = m?.[1] ? decodeURIComponent(m[1]) : "en";
    if ((["en", "zh-HK", "zh-CN", "fr", "it"] as const).includes(cookieLang as any)) {
      setLocale(cookieLang as Locale);
    }
  }, []);

  function t(key: string): string {
    return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  }

  return { t, locale };
}
