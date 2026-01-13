import { cookies } from "next/headers";
import { Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("lang")?.value as Locale | undefined;
  return value && (["en", "zh-HK", "zh-CN", "fr", "it"] as const).includes(value) ? value : "en";
}
