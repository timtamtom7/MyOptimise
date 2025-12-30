import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getGoogleOAuthConfig } from "@/lib/auth";

export const runtime = "nodejs";

function readDotEnvLocalValue(key: string): string {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf8");
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^\\s*(?:export\\s+)?${escapedKey}\\s*=\\s*(.*)\\s*$`);
    const line = content
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#") && re.test(l));
    if (!line) return "";
    const m = line.match(re);
    const raw = String(m?.[1] || "").trim();
    const unquoted =
      (raw.startsWith("\"") && raw.endsWith("\"")) ||
      (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw;
    return unquoted.trim();
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (process.env.ADMIN_KEY && key !== process.env.ADMIN_KEY) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!process.env.ADMIN_KEY && process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const envLocalPath = path.join(process.cwd(), ".env.local");
  let envLocalReadable = false;
  let envLocalSize = 0;
  let envLocalHasGoogleClientId = false;
  let envLocalHasGoogleClientSecret = false;
  try {
    const content = fs.readFileSync(envLocalPath, "utf8");
    envLocalReadable = true;
    envLocalSize = Buffer.byteLength(content, "utf8");
    const lines = content.split("\n").map((l) => l.trim());
    envLocalHasGoogleClientId = lines.some(
      (l) => l && !l.startsWith("#") && l.startsWith("GOOGLE_CLIENT_ID="),
    );
    envLocalHasGoogleClientSecret = lines.some(
      (l) => l && !l.startsWith("#") && l.startsWith("GOOGLE_CLIENT_SECRET="),
    );
  } catch {}

  const googleClientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    readDotEnvLocalValue("GOOGLE_CLIENT_ID") ||
    readDotEnvLocalValue("NEXT_PUBLIC_GOOGLE_CLIENT_ID") ||
    "";
  const googleClientSecret =
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET?.trim() ||
    readDotEnvLocalValue("GOOGLE_CLIENT_SECRET") ||
    readDotEnvLocalValue("NEXT_PUBLIC_GOOGLE_CLIENT_SECRET") ||
    "";

  const dotEnvGoogleClientId = readDotEnvLocalValue("GOOGLE_CLIENT_ID");
  const dotEnvGoogleClientSecret = readDotEnvLocalValue("GOOGLE_CLIENT_SECRET");
  const authGoogle = getGoogleOAuthConfig();

  const report = {
    nodeEnv: process.env.NODE_ENV || "",
    cwd: process.cwd(),
    envLocalPresent: fs.existsSync(envLocalPath),
    envLocalReadable,
    envLocalSize,
    envLocalHasGoogleClientId,
    envLocalHasGoogleClientSecret,
    hasSanityWriteToken: Boolean(process.env.SANITY_API_WRITE_TOKEN),
    hasSanityReadToken: Boolean(process.env.SANITY_API_READ_TOKEN),
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
    nextAuthUrl: process.env.NEXTAUTH_URL || "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
    sanityProjectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    sanityDataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "",
    hasGoogleClientId: Boolean(googleClientId),
    hasGoogleClientSecret: Boolean(googleClientSecret),
    dotEnvGoogleClientIdLen: dotEnvGoogleClientId.length,
    dotEnvGoogleClientSecretLen: dotEnvGoogleClientSecret.length,
    authGoogleClientIdLen: authGoogle.clientId.length,
    authGoogleClientSecretLen: authGoogle.clientSecret.length,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    resendFrom: process.env.RESEND_FROM || "",
  };

  return NextResponse.json(report, { status: 200 });
}
