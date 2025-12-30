import { hasAccountCapability, safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

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

  async function markThreadRead(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "message.read")) return;

    const threadId = String(formData.get("threadId") || "").trim();
    if (!threadId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const thread = await writeClient.fetch(
      `*[_type == "messageThread" && _id == $id][0]{
        _id,
        participants[]._ref,
        "readStates": readStates[]{user, lastReadAt},
        "messages": messages[]{createdAt}
      }`,
      { id: threadId },
    );
    if (!thread?._id) return;
    if (!Array.isArray(thread.participants) || !thread.participants.includes(String(acct._id))) return;

    const lastMessageAt =
      Array.isArray(thread.messages) && thread.messages.length
        ? thread.messages
            .map((m: any) => String(m?.createdAt || ""))
            .filter(Boolean)
            .sort()
            .slice(-1)[0]
        : new Date().toISOString();

    const existingReadStates = Array.isArray(thread.readStates) ? thread.readStates : [];
    const updatedReadStates = [
      ...existingReadStates.filter((rs: any) => String(rs?.user?._ref || "") !== String(acct._id)),
      { _type: "threadReadState", user: { _type: "reference", _ref: String(acct._id) }, lastReadAt: lastMessageAt },
    ];

    await writeClient.patch(threadId).set({ readStates: updatedReadStates }).commit();
    revalidatePath(`/dashboard/employee/threads/${threadId}`);
    redirect(`/dashboard/employee/threads/${threadId}`);
  }

  async function postThreadMessage(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "message.create")) return;

    const threadId = String(formData.get("threadId") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!threadId || !message) return;
    const attachment = formData.get("attachment");

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const thread = await writeClient.fetch(
      `*[_type == "messageThread" && _id == $id][0]{_id, visibility, participants[]._ref, "readStates": readStates[]{user, lastReadAt}}`,
      { id: threadId },
    );
    if (!thread?._id) return;
    if (!Array.isArray(thread.participants) || !thread.participants.includes(String(acct._id))) return;

    const now = new Date().toISOString();
    const messageVisibility = String(thread.visibility || "") === "client" ? "client" : "internal";
    const existingReadStates = Array.isArray(thread.readStates) ? thread.readStates : [];
    const updatedReadStates = [
      ...existingReadStates.filter((rs: any) => String(rs?.user?._ref || "") !== String(acct._id)),
      { _type: "threadReadState", user: { _type: "reference", _ref: String(acct._id) }, lastReadAt: now },
    ];

    let uploadedAssetId: string | null = null;
    if (attachment && typeof attachment !== "string") {
      const file = attachment as File;
      if (file.size > 0) {
        const asset = await writeClient.assets.upload("file", file, { filename: file.name });
        uploadedAssetId = String(asset?._id || "");
      }
    }

    await writeClient
      .patch(threadId)
      .setIfMissing({ messages: [], readStates: [] })
      .set({ updatedAt: now, readStates: updatedReadStates })
      .append("messages", [
        {
          _type: "threadMessage",
          author: { _type: "reference", _ref: String(acct._id) },
          visibility: messageVisibility,
          message,
          createdAt: now,
          ...(uploadedAssetId
            ? { attachments: [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }] }
            : {}),
        },
      ])
      .commit();

    revalidatePath(`/dashboard/employee/threads/${threadId}`);
    redirect(`/dashboard/employee/threads/${threadId}`);
  }

  async function toggleMessageReaction(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "message.react")) return;

    const threadId = String(formData.get("threadId") || "").trim();
    const messageKey = String(formData.get("messageKey") || "").trim();
    const emoji = String(formData.get("emoji") || "").trim();
    if (!threadId || !messageKey || !emoji) return;

    const allowedEmojis = new Set(["👍", "✅", "❤️", "🎉", "😂"]);
    if (!allowedEmojis.has(emoji)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const thread = await writeClient.fetch(
      `*[_type == "messageThread" && _id == $id][0]{
        _id,
        participants[]._ref,
        "msg": messages[_key == $messageKey][0]{
          _key,
          "reactions": reactions[]{_key, emoji, createdAt, "userId": user._ref}
        }
      }`,
      { id: threadId, messageKey },
    );
    if (!thread?._id) return;
    if (!Array.isArray(thread.participants) || !thread.participants.includes(String(acct._id))) return;
    if (!thread.msg?._key) return;

    const currentReactions = Array.isArray(thread.msg.reactions) ? thread.msg.reactions : [];
    const alreadyReacted = currentReactions.some(
      (r: any) => String(r?.emoji || "") === emoji && String(r?.userId || "") === String(acct._id),
    );

    const now = new Date().toISOString();
    const nextReactions = alreadyReacted
      ? currentReactions.filter(
          (r: any) => !(String(r?.emoji || "") === emoji && String(r?.userId || "") === String(acct._id)),
        )
      : [
          ...currentReactions,
          {
            _key: crypto.randomUUID(),
            emoji,
            user: { _type: "reference", _ref: String(acct._id) },
            createdAt: now,
          },
        ];

    const reactionsPath = `messages[_key==${JSON.stringify(messageKey)}].reactions`;
    await writeClient
      .patch(threadId)
      .set({
        updatedAt: now,
        [reactionsPath]: nextReactions.map((r: any) => ({
          _key: String(r?._key || crypto.randomUUID()),
          emoji: String(r?.emoji || ""),
          user: { _type: "reference", _ref: String(r?.user?._ref || r?.userId || "") },
          createdAt: String(r?.createdAt || now),
          _type: "threadMessageReaction",
        })),
      })
      .commit();

    revalidatePath(`/dashboard/employee/threads/${threadId}`);
    redirect(`/dashboard/employee/threads/${threadId}`);
  }

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
        <div className="mt-4 space-y-4">
          {messages.map((m: any, idx: number) => (
            <div key={idx} className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">
                {String(m?.author?.name || m?.author?.email || "Unknown")}
                {m?.createdAt ? ` • ${String(m.createdAt)}` : ""}
              </div>
              {m?.message ? <div className="mt-2 whitespace-pre-wrap text-sm">{String(m.message)}</div> : null}
              {Array.isArray(m?.reactions) && m.reactions.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(
                    (m.reactions as any[]).reduce<Record<string, number>>((acc, r) => {
                      const e = String((r as any)?.emoji || "");
                      if (!e) return acc;
                      acc[e] = (acc[e] || 0) + 1;
                      return acc;
                    }, {}),
                  ).map(([emoji, count]) => (
                    <div key={emoji} className="rounded-full border px-2 py-0.5 text-xs">
                      {emoji} {count}
                    </div>
                  ))}
                </div>
              ) : null}
              {canReact ? (
                <form action={toggleMessageReaction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="threadId" value={String(threadId)} />
                  <input type="hidden" name="messageKey" value={String(m?._key || "")} />
                  <button className="rounded-md border px-2 py-1 text-xs" name="emoji" value="👍" disabled={!canWrite || !m?._key}>
                    👍
                  </button>
                  <button className="rounded-md border px-2 py-1 text-xs" name="emoji" value="✅" disabled={!canWrite || !m?._key}>
                    ✅
                  </button>
                  <button className="rounded-md border px-2 py-1 text-xs" name="emoji" value="❤️" disabled={!canWrite || !m?._key}>
                    ❤️
                  </button>
                  <button className="rounded-md border px-2 py-1 text-xs" name="emoji" value="🎉" disabled={!canWrite || !m?._key}>
                    🎉
                  </button>
                  <button className="rounded-md border px-2 py-1 text-xs" name="emoji" value="😂" disabled={!canWrite || !m?._key}>
                    😂
                  </button>
                </form>
              ) : null}
              {Array.isArray(m?.attachments) && m.attachments.length ? (
                <div className="mt-2 space-y-1">
                  {m.attachments.map((a: any, aIdx: number) => (
                    <div key={aIdx} className="text-sm">
                      <a className="underline" href={String(a.asset?.url || "#")} target="_blank" rel="noreferrer">
                        {String(a.asset?.originalFilename || "Attachment")}
                      </a>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {messages.length === 0 ? <div className="text-sm text-muted-foreground">No messages yet.</div> : null}
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
