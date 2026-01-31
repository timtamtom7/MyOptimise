import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sanityFetch } from "@/sanity/lib/live";
import { IMPERSONATE_COOKIE_NAME, IMPERSONATE_ORIGINAL_EMAIL_COOKIE, safeGetServerSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { targetId } = await request.json();

    if (!targetId) {
      return NextResponse.json({ error: "Target ID is required" }, { status: 400 });
    }

    // Verify the target account exists and is not disabled
    const { data } = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, type, status}`,
      params: { id: targetId },
      perspective: "published",
    });

    const target = data as any;

    if (!target?._id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (String(target.status || "") === "disabled") {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
    }

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";
    cookieStore.set(IMPERSONATE_COOKIE_NAME, targetId, { 
      httpOnly: true, 
      sameSite: "lax", 
      path: "/",
      secure: isProduction,
    });
    const session = await safeGetServerSession();
    
    // Ensure we have a valid session before allowing impersonation
    if (!session || !(session as any).user?.email) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prefer the explicitly stored original email if already impersonating
    let originalEmail = (session as any)?.originalUserEmail;
    // Fallback to current user email if not yet impersonating
    if (!originalEmail) {
      originalEmail = (session as any)?.user?.email;
    }
    
    if (originalEmail) {
      const cookieOptions = {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      };

      cookieStore.set(IMPERSONATE_ORIGINAL_EMAIL_COOKIE, String(originalEmail), cookieOptions);
      
      // Double ensure by setting a non-secure cookie in dev if needed, 
      // but simpler to just trust the options.
      // If we are in dev, secure is false, which is correct.
    } else {
       console.error("CRITICAL: Could not determine original email for impersonation");
    }

    return NextResponse.json({ success: true, targetType: target.type || "employee" });
  } catch (error) {
    console.error("Error starting impersonation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
