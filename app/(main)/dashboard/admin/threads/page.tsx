import { safeGetServerSession } from "@/lib/auth";
import { sanityFetch } from "@/sanity/lib/live";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";
import { MessagesTab } from "@/components/dashboard/admin/messages-tab";
import { createOrOpenDmThread } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminThreadsPage() {
    const session = await safeGetServerSession();
    if (!session) redirect("/login");

    const email = String((session as any)?.user?.email || "");
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || String(acct.type || "").toLowerCase() !== "admin") redirect("/dashboard");

    // Fetch threads
    const threadsRes = await sanityFetch({ 
        query: `*[_type == "messageThread" && $id in participants[]._ref] {
            _id, subject, type, updatedAt,
            participants[]->{_id, name, email, avatar, type},
            messages[-1] { message, createdAt, author->{name} }
        } | order(updatedAt desc)`,
        params: { id: acct._id }
    });
    const threads = (threadsRes as any)?.data || [];

    // Fetch employees for DM creation
    const employeesRes = await sanityFetch({ query: `*[_type == "account" && type == "employee" && status == "active"]{_id, name, email, avatar}|order(name asc)` });
    const employees = (employeesRes as any)?.data || [];

    return (
        <div className="p-6">
            <MessagesTab 
                threads={threads} 
                employees={employees} 
                basePath="/dashboard/admin"
                actions={{ createOrOpenDmThread }}
            />
        </div>
    );
}
