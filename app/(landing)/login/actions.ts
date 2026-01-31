'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/live";

export async function devSkipAuth() {
  // Allow in preview/dev environments
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_PREVIEW_URL) {
     // Optional: stricter check if needed
  }

  // Find a manager account with a valid email
  const { data: manager } = await sanityFetch({
    query: `*[_type == "account" && type == "manager" && defined(email)][0]{_id}`,
  });

  if (!manager?._id) {
    throw new Error('No manager account found in Sanity. Please ensure you have seeded the database.');
  }

  // Set the cookie directly
  const cookieStore = await cookies();
  cookieStore.set("impersonateAccountId", manager._id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard/manager");
}
