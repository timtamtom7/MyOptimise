/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

import StudioClient from "./studio-client";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export { metadata, viewport } from "next-sanity/studio";

export default async function StudioPage() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) {
    redirect("/login?next=/studio");
  }
  const acct = await fetchSanityAccountByEmail({ email });
  const canAccessStudio = acct?.type === "admin";
  if (!acct || acct.status === "disabled" || !canAccessStudio) {
    redirect("/login?error=AccessDenied&next=/studio");
  }
  return <StudioClient />;
}
