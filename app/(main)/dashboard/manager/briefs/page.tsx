import { safeGetServerSession, IMPERSONATE_COOKIE_NAME } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BriefsTab } from "@/components/dashboard/manager/briefs-tab";
import * as actions from "@/app/actions/manager";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Brief } from "@/types/briefs";

export const dynamic = "force-dynamic";

export default async function ManagerBriefsPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/manager/briefs");
  }

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "").toLowerCase();
  
  if (!type) redirect("/login?error=no_account");
  if (String((acct as any)?.status || "") === "disabled") redirect("/login?error=disabled");

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE_NAME)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = type;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status}`,
      params: { id: impersonateId },
    });
    const target = (targetRes as any)?.data as any;
    if (target?._id && String(target.status || "") !== "disabled") {
      effectiveAcct = target;
      effectiveType = String(target.type || "").toLowerCase();
    }
  }

  if (effectiveType !== "manager" && effectiveType !== "admin") {
    redirect("/dashboard");
  }

  const effectiveAcctId = String(effectiveAcct?._id || "");
  const emailLower = String(effectiveAcct?.email || email || "").toLowerCase();

  // Fetch workspace ID for Supabase queries
  let workspaceId: string | null = null;
  try {
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", emailLower)
      .single();
    
    if (userData?.id) {
       const { data: memberData } = await (supabaseAdmin as any)
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userData.id)
        .single();
       if (memberData?.workspace_id) {
          workspaceId = memberData.workspace_id;
       }
    }
  } catch (err) {
    console.error("Error fetching workspace ID:", err);
  }

  // Fetch data
  const [
    employeesRes,
    managerDeliverablesRes,
    briefsRes
  ] = await Promise.all([
    sanityFetch({ query: `*[_type == "account" && type == "employee" && status == "active"]{_id, name, email, avatar, status}|order(name asc)` }),
    sanityFetch({
        query: `*[_type == "deliverable" && campaign->manager._ref == $managerId && status != "archived"] | order(createdAt desc)[0..199]{
          _id, title, status, assignedTo->{_id, name, email}, client->{name}, campaign->{title},
          dueDate, format, description, hook, script, visualDirection, price,
          versionHistory[]{versionNumber, url, "fileUrl": file.asset->url, notes, createdAt},
          statusHistory[]{fromStatus, toStatus, changedAt},
          approvalToken, approvalTokenExpiry, feedback, _createdAt, _updatedAt
        }`,
        params: { managerId: effectiveAcctId }
    }),
    workspaceId
      ? (supabaseAdmin as any)
          .from("briefs")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] })
  ]);

  const employees = (employeesRes as any)?.data || [];
  const managerDeliverables = (managerDeliverablesRes as any)?.data || [];
  const rawBriefs = (briefsRes as any)?.data || [];

  const mapStatus = (s: string): Brief["status"] => {
    switch (s) {
      case "todo": return "draft";
      case "drafting": return "assigned";
      case "internal_review": return "in_review";
      case "client_review": return "client_review";
      case "approved": return "approved";
      case "scheduled": return "scheduled";
      case "changes_requested": return "assigned";
      default: return "draft";
    }
  };

  const deliverableBriefs: Brief[] = managerDeliverables.map((d: any) => {
    const requiredAssets = Array.isArray(d.assets)
      ? d.assets
          .map((asset: any) => {
            if (asset?._type === "file" && asset?.asset?._ref) return null;
            if (typeof asset === "string") return { type: "url" as const, url: asset };
            if (asset && typeof asset.url === "string") return { type: "url" as const, url: asset.url };
            return null;
          })
          .filter((item: any): item is { type: "file" | "url"; url: string } => Boolean(item && item.url))
      : null;

    return {
      id: String(d._id),
      workspace_id: workspaceId || "default",
      title: String(d.title || "Untitled"),
      hook: d.hook || null,
      script: d.script || null,
      visual_direction: d.visualDirection || null,
      assets_url: null,
      video_url: d.versionHistory?.[d.versionHistory.length - 1]?.url || d.versionHistory?.[d.versionHistory.length - 1]?.fileUrl || null,
      feedback: null,
      status: mapStatus(String(d.status || "")),
      assignee_id: d.assignedTo?._id || null,
      author_id: "system",
      price: typeof d.price === "number" ? d.price : null,
      creative_goal: d.creativeGoal || null,
      content_concept: d.contentConcept || null,
      references: Array.isArray(d.references) ? (d.references as string[]) : null,
      required_assets: requiredAssets,
      difficulty: d.difficulty || null,
      claimed_at: d.claimedAt || null,
      deadline: d.dueDate || null,
      platform: d.platform || null,
      format: d.format || null,
      metadata: {
        client: d.client?.name,
        campaign: d.campaign?.title,
        dueDate: d.dueDate,
        format: d.format,
        approvalToken: d.approvalToken,
        approvalTokenExpiry: d.approvalTokenExpiry,
        statusHistory: Array.isArray(d.statusHistory) ? d.statusHistory : [],
        feedback: Array.isArray(d.feedback) ? d.feedback : [],
      },
      created_at: d._createdAt,
      updated_at: d._updatedAt,
    };
  });

  const supabaseBriefs: Brief[] = rawBriefs.map((b: any) => ({
    ...b,
    status: b.status as Brief["status"],
    metadata: {
      ...((b.metadata as object) || {}),
      approvalToken: b.approval_token,
      approvalTokenExpiry: b.approval_token_expiry,
      feedback: b.feedback ? [{ content: b.feedback, createdAt: b.updated_at }] : [],
    }
  }));

  const allBriefs: Brief[] = [...deliverableBriefs, ...supabaseBriefs];

  const editors = employees.map((e: any) => ({ id: e._id, name: e.name }));

  return (
    <div className="space-y-6">
      <BriefsTab 
        briefs={allBriefs}
        editors={editors}
        createBriefAction={actions.createBrief}
        approveBriefAction={actions.approveBrief}
        rejectBriefAction={actions.rejectBrief}
      />
    </div>
  );
}
