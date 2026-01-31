import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { IMPERSONATE_COOKIE_NAME, IMPERSONATE_ORIGINAL_EMAIL_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  // Force delete with explicit options matching start/route.ts
  cookieStore.set(IMPERSONATE_COOKIE_NAME, "", { 
    maxAge: 0, 
    path: "/", 
    sameSite: "lax", 
    httpOnly: true,
    secure: isProduction
  });
  
  // Also try deleting with secure: false just in case of environment mismatch (local dev)
  if (!isProduction) {
      cookieStore.set(IMPERSONATE_COOKIE_NAME, "", { 
        maxAge: 0, 
        path: "/", 
        sameSite: "lax", 
        httpOnly: true,
        secure: false
      });
  }

  // Try deleting with explicit domain if possible (though we can't easily guess it here without env)
  // But standard path "/" should work.
  
  cookieStore.delete(IMPERSONATE_COOKIE_NAME);
  
  // Do NOT delete IMPERSONATE_ORIGINAL_EMAIL_COOKIE here.
  // We need it to survive this request so that the next session callback 
  // can use it to restore the original user session.
  
  return NextResponse.json({ success: true });
}

export async function GET() {
  const cookieStore = await cookies();
  // Force delete with explicit path and maxAge to ensure browser clears it
  cookieStore.set(IMPERSONATE_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  cookieStore.delete(IMPERSONATE_COOKIE_NAME);
  
  // Do NOT delete IMPERSONATE_ORIGINAL_EMAIL_COOKIE here.
  
  const url = new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100");
  return NextResponse.redirect(url);
}
