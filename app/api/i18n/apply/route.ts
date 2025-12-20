import { NextResponse } from "next/server";
import { safeGetServerSession } from "@/lib/auth";
import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";

export async function POST(request: Request) {
  const session = await safeGetServerSession();
  const isAdmin = Boolean((session as any)?.isAdmin);
  if (!isAdmin && process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  if (!writeToken) {
    return new NextResponse("Missing write token", { status: 500 });
  }
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const payload = await request.json().catch(() => ({}));
  const normalize = (obj: any) => {
    const convert = (i18n: any) => {
      if (!i18n) return i18n;
      return {
        en: i18n.en ?? "",
        zh_hk: i18n["zh-HK"] ?? i18n.zh_hk ?? "",
        zh_cn: i18n["zh-CN"] ?? i18n.zh_cn ?? "",
      };
    };
    if (obj.title_i18n) obj.title_i18n = convert(obj.title_i18n);
    if (obj.description_i18n) obj.description_i18n = convert(obj.description_i18n);
    if (obj.location_i18n) obj.location_i18n = convert(obj.location_i18n);
    if (obj.name_i18n) obj.name_i18n = convert(obj.name_i18n);
    return obj;
  };
  const events: any[] = Array.isArray(payload.events) ? payload.events.map(normalize) : [];
  const orgs: any[] = Array.isArray(payload.orgs) ? payload.orgs.map(normalize) : [];

  let updated = 0;
  for (const e of events) {
    if (!e._id) continue;
    await writeClient
      .patch(e._id)
      .set({
        title_i18n: e.title_i18n,
        description_i18n: e.description_i18n,
        location_i18n: e.location_i18n,
      })
      .commit()
      .then(() => updated++)
      .catch(() => {});
  }

  for (const o of orgs) {
    if (!o._id) continue;
    await writeClient
      .patch(o._id)
      .set({
        name_i18n: o.name_i18n,
        description_i18n: o.description_i18n,
      })
      .commit()
      .then(() => updated++)
      .catch(() => {});
  }

  return NextResponse.json({ updated });
}
