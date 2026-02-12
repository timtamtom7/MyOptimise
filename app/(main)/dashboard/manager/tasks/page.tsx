import { safeGetServerSession, IMPERSONATE_COOKIE_NAME } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TasksTab } from "@/components/dashboard/admin/tasks-tab";
import * as actions from "@/app/actions/manager";

export const dynamic = "force-dynamic";

export default async function ManagerTasksPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/manager/tasks");
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
  const canCreateTasks = hasAccountCapability(effectiveAcct, "task.create");
  const canAssign = hasAccountCapability(effectiveAcct, "task.assign.team");

  // Fetch data
  const [
    employeesRes,
    unassignedWorkItemsRes,
    myWorkItemsRes,
    teamWorkItemsRes,
  ] = await Promise.all([
    sanityFetch({ query: `*[_type == "account" && type == "employee" && status == "active"]{_id, name, email, avatar, status}|order(name asc)` }),
    sanityFetch({ 
        query: `*[_type == "workItem" && !defined(assignedTo) && status != "completed" && status != "cancelled"]{_id, title, priority, status, dueDate, visibility, "assignedTo": assignedTo->{name, email, avatar}}|order(createdAt desc)` 
    }),
    sanityFetch({ 
        query: `*[_type == "workItem" && assignedTo._ref == $id && status != "completed" && status != "cancelled"]{_id, title, priority, status, dueDate, visibility}|order(dueDate asc)`,
        params: { id: effectiveAcctId }
    }),
    sanityFetch({ 
        query: `*[_type == "workItem" && status != "completed" && status != "cancelled"]{_id, title, priority, status, dueDate, visibility, "assignedTo": assignedTo->{name, email, avatar}, "commentsCount": count(comments)}|order(createdAt desc)` 
    }),
  ]);

  const employees = (employeesRes as any)?.data || [];
  const unassignedWorkItems = (unassignedWorkItemsRes as any)?.data || [];
  const myWorkItems = (myWorkItemsRes as any)?.data || [];
  const teamWorkItems = (teamWorkItemsRes as any)?.data || [];

  return (
    <div className="space-y-6">
      <TasksTab
        employees={employees}
        openWorkItems={teamWorkItems} // TasksTab expects "openWorkItems" which seems to be the main list. ManagerView passed "teamWorkItems" as "teamTasks" but TasksTab prop name is "openWorkItems"
        unassignedWorkItems={unassignedWorkItems}
        capabilities={{
          canCreate: canCreateTasks,
          canAssign: canAssign,
          canManageTaskTemplates: false, // Managers typically don't manage templates in this view yet
          canDelete: false // Managers might not have delete permission by default
        }}
        actions={actions}
      />
    </div>
  );
}
