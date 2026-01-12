import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sanityFetch } from "@/sanity/lib/live";

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
    cookieStore.set("impersonateAccountId", targetId, { 
      httpOnly: true, 
      sameSite: "lax", 
      path: "/" 
    });

    return NextResponse.json({ success: true, targetType: target.type || "employee" });
  } catch (error) {
    console.error("Error starting impersonation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
