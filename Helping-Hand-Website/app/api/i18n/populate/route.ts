import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";
import { groq } from "next-sanity";

async function translate(text: string, target: "zh-CN" | "zh-TW") {
  const q = encodeURIComponent(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${q}`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();
    const chunks = Array.isArray(data?.[0]) ? data[0] : [];
    const translated = chunks.map((c: any) => c?.[0]).filter(Boolean).join("");
    return translated || text;
  } catch {
    return text;
  }
}

async function buildI18n(value: string | null | undefined) {
  const v = (value || "").toString().trim();
  if (!v) return undefined;
  const zh_cn = await translate(v, "zh-CN");
  const zh_hk = await translate(v, "zh-TW");
  return { en: v, zh_hk, zh_cn };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const isAdmin = Boolean((session as any)?.isAdmin);
  if (!isAdmin && process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  if (!writeToken) {
    return new NextResponse("Missing write token", { status: 500 });
  }
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const events = await client.fetch(groq`*[_type == "event"]{_id, title, description, location}`);
  const orgs = await client.fetch(groq`*[_type == "organization"]{_id, name, description}`);

  let updated = 0;
  for (const e of events as any[]) {
    try {
      const [title_i18n, description_i18n, location_i18n] = await Promise.all([
        buildI18n(e.title),
        buildI18n(e.description),
        buildI18n(e.location),
      ]);
      await writeClient.patch(e._id).set({ title_i18n, description_i18n, location_i18n }).commit();
      updated++;
    } catch {}
  }
  for (const o of orgs as any[]) {
    try {
      const [name_i18n, description_i18n] = await Promise.all([
        buildI18n(o.name),
        buildI18n(o.description),
      ]);
      await writeClient.patch(o._id).set({ name_i18n, description_i18n }).commit();
      updated++;
    } catch {}
  }

  return NextResponse.json({ updated });
}

export const POST = GET;
