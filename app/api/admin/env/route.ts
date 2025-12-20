import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!process.env.ADMIN_KEY && process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const report = {
    nodeEnv: process.env.NODE_ENV || "",
    hasSanityWriteToken: Boolean(process.env.SANITY_API_WRITE_TOKEN),
    hasSanityReadToken: Boolean(process.env.SANITY_API_READ_TOKEN),
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    nextAuthUrl: process.env.NEXTAUTH_URL || "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
    sanityProjectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    sanityDataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "",
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    resendFrom: process.env.RESEND_FROM || "",
  };

  return NextResponse.json(report, { status: 200 });
}

