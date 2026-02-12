import { safeGetServerSession, IMPERSONATE_COOKIE_NAME } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TeamTab } from "@/components/dashboard/manager/team-tab";
import * as actions from "@/app/actions/manager";

export const dynamic = "force-dynamic";

export default async function ManagerTeamPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/manager/team");
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

  const canInviteEmployees = hasAccountCapability(effectiveAcct, "users.invite.limited");

  const employeesRes = await sanityFetch({ query: `*[_type == "account" && type == "employee" && status == "active"]{_id, name, email, avatar, status}|order(name asc)` });
  const employees = (employeesRes as any)?.data || [];

  return (
    <div className="space-y-6">
      <TeamTab 
        employees={employees}
        capabilities={{
            canInvite: canInviteEmployees
        }}
        actions={actions}
      />
    </div>
  );
}
