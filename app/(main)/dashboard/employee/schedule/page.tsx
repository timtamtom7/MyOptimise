import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScheduleView } from "@/components/dashboard/employee/schedule-view";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  // Need current user ID for participant filtering
  const { data: currentUser } = await sanityFetch({
    query: `*[_type == "account" && email == $email][0]{_id}`,
    params: { email },
  });

  if (!currentUser) redirect("/login");

  const { data } = await sanityFetch({
    query: `{
      "scheduleItems": *[_type == "scheduleItem" && ($userId in participants[]._ref || visibility == "internal" || visibility == "team")] | order(startsAt asc),
      "tasks": *[_type == "workItem" && assignedTo._ref == $userId && dueDate != null] | order(dueDate asc){
        _id, title, "startsAt": dueDate, "type": "task"
      },
      "deliverables": *[_type == "deliverable" && assignedTo._ref == $userId && dueDate != null] | order(dueDate asc){
        _id, title, "startsAt": dueDate, "type": "deliverable"
      }
    }`,
    params: { userId: currentUser._id },
  });

  // Combine and normalize items
  const combinedItems = [
    ...(data?.scheduleItems || []),
    ...(data?.tasks || []).map((t: any) => ({ ...t, visibility: "internal" })),
    ...(data?.deliverables || []).map((d: any) => ({ ...d, visibility: "internal" })),
  ].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Schedule</h1>
      </div>
      <ScheduleView items={combinedItems} currentUserId={currentUser._id} />
    </div>
  );
}
