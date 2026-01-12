import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("impersonateAccountId");
  return NextResponse.json({ success: true });
}

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("impersonateAccountId");
  // Redirect to dashboard
  const url = new URL("/dashboard", "http://localhost:3000"); // Base URL will be inferred by browser if relative redirect, but API routes need full URL or NextResponse.redirect
  // Actually, NextResponse.redirect needs an absolute URL.
  // We can just return a redirect response using relative path if we use NextResponse.redirect(new URL('/dashboard', request.url))
  return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
