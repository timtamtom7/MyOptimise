import { safeGetServerSession, IMPERSONATE_COOKIE_NAME } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { postThreadMessage, markThreadRead } from "@/app/actions/messages";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageList } from "@/components/messages/MessageList";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = IMPERSONATE_COOKIE_NAME;

export default async function EmployeeThreadPage(props: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await props.params;

  const session = await safeGetServerSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/employee/threads/${threadId}`)}`);
  }

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "");
  if (!type) {
    redirect(`/login?error=no_account&next=${encodeURIComponent(`/dashboard/employee/threads/${threadId}`)}`);
  }
  if (String((acct as any)?.status || "") === "disabled") {
    redirect(`/login?error=disabled&next=${encodeURIComponent(`/dashboard/employee/threads/${threadId}`)}`);
  }
  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = type;
  let isImpersonating = false;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status}`,
      params: { id: impersonateId },
      perspective: "published",
    });
    const target = (targetRes as any)?.data as any;
    if (target?._id && String(target.status || "") !== "disabled") {
      effectiveAcct = target;
      effectiveType = String(target.type || "");
      isImpersonating = true;
    }
  }

  if (effectiveType !== "employee") {
    redirect("/dashboard");
  }

  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;
  const canMarkRead = hasAccountCapability(effectiveAcct, "message.read");
  const canReact = hasAccountCapability(effectiveAcct, "message.react");

  const threadRes = await sanityFetch({
    query: `*[_type == "messageThread" && _id == $id][0]{
      _id,
      title,
      type,
      visibility,
      createdAt,
      updatedAt,
      "participants": participants[]->{_id, name, email, type, status},
      "messages": messages[]{
        _key,
        message,
        createdAt,
        visibility,
        status,
        author->{_id, name, email, type, status},
        "reactions": reactions[]{_key, emoji, createdAt, user->{_id, name, email}},
        attachments[]{asset->{url, originalFilename}}
      }
    }`,
    params: { id: threadId },
  });

  const thread = (threadRes as any)?.data as any;
  const participants = (thread?.participants ?? []) as any[];
  const canView =
    thread?._id &&
    Array.isArray(participants) &&
    participants.some((p) => String(p?._id || "") === String(effectiveAcct?._id || ""));

  if (!canView) {
    redirect("/dashboard/employee");
  }

  const messages = ((thread?.messages ?? []) as any[]).slice().sort((a, b) => {
    const aa = String(a?.createdAt || "");
    const bb = String(b?.createdAt || "");
    return aa.localeCompare(bb);
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">
            <Link href="/dashboard/employee" className="underline">
              Back
            </Link>
          </div>
          <h1 className="mt-2 text-2xl font-semibold truncate">{String(thread?.title || "Thread")}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {String(thread?.type || "")}
            {thread?.visibility ? ` • ${String(thread.visibility)}` : ""}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Participants</div>
        <div className="mt-2 text-sm">
          {participants
            .map((p) => String(p?.name || p?.email || p?._id || "Unknown"))
            .filter(Boolean)
            .join(", ")}
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Messages</div>
        {canMarkRead ? (
          <form action={markThreadRead} className="mt-3">
            <input type="hidden" name="threadId" value={String(threadId)} />
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Mark as read
            </button>
          </form>
        ) : null}
        
        <div className="mt-4">
          <MessageList 
            messages={messages} 
            threadId={threadId} 
            currentUserId={String(effectiveAcct._id)} 
            canReact={canReact}
            canWrite={canWrite}
          />
        </div>

        <form action={postThreadMessage} className="mt-6 grid gap-2" encType="multipart/form-data">
          <input type="hidden" name="threadId" value={String(threadId)} />
          <textarea
            name="message"
            className="min-h-[90px] rounded-md border px-3 py-2 text-sm"
            placeholder="Write a message…"
            required
          />
          <input name="attachment" type="file" className="text-sm" />
          <button className="justify-self-start rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
