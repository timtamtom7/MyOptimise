import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { MessagesTab } from "@/components/dashboard/admin/messages-tab";
import { createOrOpenDmThread } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminThreadDetailPage(props: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await props.params;

  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || String(acct.type || "").toLowerCase() !== "admin") redirect("/dashboard");

  const threadsRes = await sanityFetch({
    query: `*[_type == "messageThread" && _id == $id]{
      _id, subject, type, updatedAt,
      participants[]->{_id, name, email, avatar, type},
      messages[-1] { message, createdAt, author->{name} }
    }`,
    params: { id: threadId },
  });

  const thread = (threadsRes as any)?.data;
  if (!thread?._id) {
    redirect("/dashboard/admin/threads");
  }

  const employeesRes = await sanityFetch({
    query: `*[_type == "account" && type == "employee" && status == "active"]{
      _id, name, email, avatar
    }|order(name asc)`,
  });
  const employees = (employeesRes as any)?.data || [];

  return (
    <div className="p-6">
      <MessagesTab
        threads={[thread]}
        employees={employees}
        basePath="/dashboard/admin"
        actions={{ createOrOpenDmThread }}
      />
    </div>
  );
}

