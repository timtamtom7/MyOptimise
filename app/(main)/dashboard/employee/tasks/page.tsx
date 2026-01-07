import { WorkItemsTable } from "@/components/dashboard/employee/work-items-table";
import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  updateWorkItemStatus, 
  markWorkItemBlocked, 
  createWorkItem, 
  createWorkItemFromTemplate 
} from "@/app/actions/work-items";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const { data: currentUser } = await sanityFetch({
    query: `*[_type == "account" && email == $email][0]{_id}`,
    params: { email },
  });

  if (!currentUser) redirect("/login");

  const { data: workItems } = await sanityFetch({
    query: `*[_type == "workItem" && (assignedTo._ref == $userId || createdBy._ref == $userId)] | order(dueDate asc){
      _id, title, description, status, priority, dueDate,
      "createdByName": createdBy->name,
      blockedReason,
      checklist[]
    }`,
    params: { userId: currentUser._id },
  });

  const { data: templates } = await sanityFetch({
    query: `*[_type == "workItem" && isTemplate == true] | order(title asc){
      _id, title
    }`,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
      </div>
      <WorkItemsTable 
        items={workItems || []} 
        templates={templates || []}
        onUpdateStatus={updateWorkItemStatus}
        onMarkBlocked={markWorkItemBlocked}
        onCreateWorkItem={createWorkItem}
        onCreateFromTemplate={createWorkItemFromTemplate}
      />
    </div>
  );
}
