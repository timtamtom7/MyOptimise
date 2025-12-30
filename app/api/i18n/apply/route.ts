import { NextResponse } from "next/server";

const allowed = new Set(["en", "zh-HK", "zh-CN"]);

function withLangCookie(response: NextResponse, lang: string) {
  response.cookies.set("lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = String(url.searchParams.get("lang") || "");
  const returnTo = String(url.searchParams.get("returnTo") || "/");
  const nextLang = allowed.has(lang) ? lang : "en";

  const redirectUrl = new URL(returnTo, url.origin);
  return withLangCookie(NextResponse.redirect(redirectUrl), nextLang);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let lang = "";
  let returnTo = "/";

  try {
    const body = await request.json();
    lang = String(body?.lang || "");
    returnTo = String(body?.returnTo || "/");
  } catch {
    lang = String(url.searchParams.get("lang") || "");
    returnTo = String(url.searchParams.get("returnTo") || "/");
  }

  const nextLang = allowed.has(lang) ? lang : "en";
  const redirectUrl = new URL(returnTo, url.origin);
  return withLangCookie(NextResponse.redirect(redirectUrl), nextLang);
}
