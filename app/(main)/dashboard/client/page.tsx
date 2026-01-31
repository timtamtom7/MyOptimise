import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientView } from "@/components/dashboard/client/client-view";
import { approveDeliverable, rejectDeliverable } from "@/app/actions/deliverables";
import { sendEmail } from "@/lib/email";
import { clientRequestSubmittedEmail, clientRequestReplyEmail } from "@/lib/email-templates";
import { deepseek } from "@/lib/ai";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

export default async function ClientDashboardPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/client");
  }
  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "");
  if (!type) {
    redirect("/login?error=no_account&next=/dashboard/client");
  }
  if (String((acct as any)?.status || "") === "disabled") {
    redirect("/login?error=disabled&next=/dashboard/client");
  }

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = type;
  let isImpersonating = false;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status, timezone}`,
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

  if (effectiveType !== "client") {
    redirect("/dashboard");
  }

  const name = String((session as any)?.user?.name || "");
  const emailLower = String(effectiveAcct?.email || email || "").toLowerCase();
  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;
  const canViewServices = hasAccountCapability(effectiveAcct, "client.services.view");
  const canToggleServices = hasAccountCapability(effectiveAcct, "client.services.toggle");
  const canRequestServices = hasAccountCapability(effectiveAcct, "client.services.request_new");
  const acctId = String(effectiveAcct?._id || "");

  async function submitClientRequest(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "support.ticket.create")) return;

    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const category = String(formData.get("type") || "support").trim();
    const priority = String(formData.get("priority") || "medium").trim();
    if (!subject || !message) return;
    const attachment = formData.get("attachment");

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    let uploadedAssetId: string | null = null;
    if (attachment && typeof attachment !== "string") {
      const file = attachment as File;
      if (file.size > 0) {
        const asset = await writeClient.assets.upload("file", file, { filename: file.name });
        uploadedAssetId = String(asset?._id || "");
      }
    }

    await writeClient.create({
      _type: "clientRequest",
      subject,
      message,
      category,
      priority,
      clientEmail: email.toLowerCase(),
      clientAccount: { _type: "reference", _ref: String(acct._id) },
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          _type: "clientRequestMessage",
          author: { _type: "reference", _ref: String(acct._id) },
          visibility: "client",
          message,
          createdAt: new Date().toISOString(),
          ...(uploadedAssetId
            ? { attachments: [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }] }
            : {}),
        },
      ],
    });

    // Notify admins
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
    if (adminEmails.length > 0) {
      const link = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100"}/dashboard/admin/intake`;
      await sendEmail({
        to: adminEmails,
        subject: `New Request from ${acct.name}: ${subject}`,
        html: clientRequestSubmittedEmail({
          clientName: String(acct.name || "Client"),
          subject,
          link,
        }),
      });
    }

    revalidatePath("/dashboard/client");
  }

  async function addClientRequestMessage(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "support.threads.participate")) return;

    const id = String(formData.get("id") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!id || !message) return;
    const attachment = formData.get("attachment");

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "clientRequest" && _id == $id && clientEmail != null && lower(clientEmail) == $email][0]{_id, subject}`,
      { id, email: email.toLowerCase() },
    );
    if (!canUpdate?._id) return;

    let uploadedAssetId: string | null = null;
    if (attachment && typeof attachment !== "string") {
      const file = attachment as File;
      if (file.size > 0) {
        const asset = await writeClient.assets.upload("file", file, { filename: file.name });
        uploadedAssetId = String(asset?._id || "");
      }
    }

    await writeClient
      .patch(id)
      .set({ updatedAt: new Date().toISOString() })
      .setIfMissing({ messages: [] })
      .append("messages", [
        {
          _type: "clientRequestMessage",
          author: { _type: "reference", _ref: String(acct._id) },
          visibility: "client",
          message,
          createdAt: new Date().toISOString(),
          ...(uploadedAssetId
            ? { attachments: [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }] }
            : {}),
        },
      ])
      .commit();

    // Notify admins of reply
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
    if (adminEmails.length > 0) {
      const link = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100"}/dashboard/admin/intake`;
      await sendEmail({
        to: adminEmails,
        subject: `New Reply from ${acct.name}: ${canUpdate.subject}`,
        html: clientRequestReplyEmail({
          clientName: String(acct.name || "Client"),
          subject: canUpdate.subject || "Request",
          message,
          link,
        }),
      });
    }

    revalidatePath("/dashboard/client");
  }

  async function createOrOpenSupportThread(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "support.threads.participate")) return;

    const recipientId = String(formData.get("recipientId") || "").trim();
    if (!recipientId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const recipient = await writeClient.fetch(
      `*[_type == "account" && _id == $id][0]{_id, type, status}`,
      { id: recipientId },
    );
    if (!recipient?._id) return;
    if (String(recipient.status || "") === "disabled") return;
    if (!["admin", "manager"].includes(String(recipient.type || ""))) return;

    const existing = await writeClient.fetch(
      `*[_type == "messageThread" && type in ["support","dm"] && visibility == "client" && count(participants) == 2 && $a in participants[]._ref && $b in participants[]._ref][0]{_id}`,
      { a: String(acct._id), b: recipientId },
    );
    if (existing?._id) {
      revalidatePath("/dashboard/client");
      redirect(`/dashboard/client/threads/${String(existing._id)}`);
    }

    const created = await writeClient.create({
      _type: "messageThread",
      title: "Support",
      type: "support",
      visibility: "client",
      participants: [
        { _type: "reference", _ref: String(acct._id) },
        { _type: "reference", _ref: recipientId },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });

    revalidatePath("/dashboard/client");
    redirect(`/dashboard/client/threads/${String(created?._id || "")}`);
  }

  async function setClientServiceEnabled(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "client.services.toggle")) return;

    const id = String(formData.get("id") || "").trim();
    const enabled = String(formData.get("enabled") || "") === "on";
    if (!id) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const svc = await writeClient.fetch(
      `*[_type == "clientService" && _id == $id && clientCanToggle == true && client._ref == $acctId][0]{_id}`,
      { id, acctId: String(acct._id) },
    );
    if (!svc?._id) return;

    await writeClient
      .patch(id)
      .set({
        clientEnabled: enabled,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    revalidatePath("/dashboard/client");
  }

  async function submitServiceRequest(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "client.services.request_new")) return;

    const requestedServiceType = String(formData.get("requestedServiceType") || "other").trim();
    const details = String(formData.get("details") || "").trim();
    const attachment = formData.get("attachment");
    if (!["instagram", "facebook", "email", "website", "ads", "seo", "other"].includes(requestedServiceType)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    let uploadedAssetId: string | null = null;
    if (attachment && typeof attachment !== "string") {
      const file = attachment as File;
      if (file.size > 0) {
        const asset = await writeClient.assets.upload("file", file, { filename: file.name });
        uploadedAssetId = String(asset?._id || "");
      }
    }

    const now = new Date().toISOString();
    await writeClient.create({
      _type: "serviceRequest",
      clientAccount: { _type: "reference", _ref: String(acct._id) },
      requestedServiceType,
      details: details || undefined,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
      ...(uploadedAssetId ? { attachments: [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }] } : {}),
    });

    revalidatePath("/dashboard/client");
  }

  async function suggestBrandAssetTags(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;

    const requester = await fetchSanityAccountByEmail({ email });
    if (!requester || requester.status === "disabled") return;

    const accountId = String(formData.get("accountId") || "").trim();
    const assetKey = String(formData.get("assetKey") || "").trim();
    const assetTitle = String(formData.get("assetTitle") || "").trim();
    const assetType = String(formData.get("assetType") || "").trim();
    const assetUrl = String(formData.get("assetUrl") || "").trim();

    if (!accountId || !assetKey) return;

    const requesterType = String(requester.type || "").toLowerCase();
    const isAdminOrManager = requesterType === "admin" || requesterType === "manager";
    const isSelfClient = requesterType === "client" && String(requester._id || "") === accountId;
    if (!isAdminOrManager && !isSelfClient) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const details: string[] = [];
    details.push(`Title: ${assetTitle || "Untitled asset"}`);
    if (assetType) details.push(`Type: ${assetType}`);
    if (assetUrl) details.push(`URL: ${assetUrl}`);

    const prompt = `You are tagging brand assets for a marketing team.
Based on the following information, generate 3-7 short, lowercase tags (single or double words)
that will help editors search for this asset.
Return ONLY a JSON array of strings, with no explanation.

${details.join("\n")}`;

    let tags: string[] = [];

    try {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You generate concise, searchable tags for brand assets." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      });

      const raw = response.choices?.[0]?.message?.content || "[]";
      const match = raw.match(/\[[\s\S]*\]/);
      const json = match ? match[0] : raw;
      const parsed = JSON.parse(json);

      if (Array.isArray(parsed)) {
        tags = parsed
          .map((t: any) => String(t || "").trim().toLowerCase())
          .filter((t: string) => t.length > 0)
          .slice(0, 10);
      }
    } catch (error) {
      console.error("Failed to generate brand asset tags", error);
      return;
    }

    if (tags.length === 0) return;

    try {
      await writeClient
        .patch(accountId)
        .set({
          [`brandAssets[_key=="${assetKey}"].aiTags`]: tags,
        })
        .commit();
    } catch (error) {
      console.error("Failed to save AI tags for brand asset", error);
      return;
    }

    revalidatePath("/dashboard/client");
    revalidatePath(`/dashboard/business/${accountId}`);
  }

  const [
    myRequestsRes,
    supportStaffRes,
    myThreadsRes,
    clientWorkItemsRes,
    clientServicesRes,
    myServiceRequestsRes,
    myDeliverablesRes,
    activeCampaignRes,
    contentItemsRes,
    socialConnectionsRes,
    analyticsRes,
  ] = await Promise.all([
    sanityFetch({
      query: `*[_type == "clientRequest" && clientEmail != null && lower(clientEmail) == $email] | order(createdAt desc)[0..9]{
        _id, subject, status, createdAt, response, category, priority,
        statusHistory[]{fromStatus, toStatus, changedAt},
        messages[visibility == "client"]{
          message, createdAt, visibility,
          author->{name, email},
          attachments[]{asset->{url, originalFilename}}
        }
      }`,
      params: { email: emailLower },
    }),
    sanityFetch({
      query: `*[_type == "account" && status != "disabled" && type in ["admin","manager"]] | order(type asc, name asc, email asc){
        _id, name, email, type
      }`,
    }),
    sanityFetch({
      query: `*[_type == "messageThread" && visibility == "client" && $acctId in participants[]._ref] | order(coalesce(updatedAt, createdAt) desc)[0..9]{
        _id, title, type, visibility, createdAt, updatedAt,
        "readStates": readStates[]{user, lastReadAt},
        "messageCount": count(messages[visibility == "client"]),
        "recentMessages": messages[visibility == "client"][-3..-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "lastMessage": messages[visibility == "client"][-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "participants": participants[]->{_id, name, email, type}
      }`,
      params: { acctId: String(effectiveAcct?._id || "") },
    }),
    sanityFetch({
      query: `*[_type == "workItem" && isTemplate != true && visibility == "client" && clientAccount._ref == $acctId] | order(coalesce(dueDate, createdAt) asc)[0..19]{
        _id, title, description, status, priority, dueDate, createdAt,
        "commentsCount": count(comments),
        attachments[]{asset->{url, originalFilename}}
      }`,
      params: { acctId },
    }),
    canViewServices
      ? sanityFetch({
        query: `*[_type == "clientService" && client._ref == $acctId] | order(coalesce(updatedAt, createdAt) desc)[0..49]{
            _id, title, serviceType, status, statusNote, clientCanToggle, clientEnabled, createdAt, updatedAt
          }`,
        params: { acctId },
      })
      : Promise.resolve({ data: [] }),
    sanityFetch({
      query: `*[_type == "serviceRequest" && clientAccount._ref == $acctId] | order(createdAt desc)[0..19]{
        _id, status, requestedServiceType, details, resolutionNote, createdAt, updatedAt,
        attachments[]{asset->{url, originalFilename}}
      }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "deliverable" && campaign->client._ref == $acctId] | order(createdAt desc) {
          _id, title, status, type, dueDate, createdAt,
          hook, script, visualDirection, creativeGoal, contentConcept,
          statusHistory[]{fromStatus, toStatus, changedAt, changedBy->{name, email}},
          "campaignTitle": campaign->title,
          "latestAsset": versionHistory[-1].asset->{url, originalFilename, mimeType, extension},
          "latestVersion": versionHistory[-1]{versionNumber, url, notes, createdAt},
          "assigneeName": assignedTo->name,
          assets[]{url, originalFilename}
        }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "campaign" && client._ref == $acctId && status in ["active", "planned"]] | order(startDate asc){
          _id, title, description, startDate, endDate, status
        }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "contentItem" && client._ref == $acctId]{
          _id, title, caption, scheduledAt, status, platform, postType,
          "firstAssetUrl": media[0].asset->url,
          "firstAssetMime": media[0].asset->mimeType,
          annotations
        }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "socialConnection" && client._ref == $acctId]{
        _id, platform, pageName, status, pageId
      }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "analyticsRecord" && client._ref == $acctId] | order(metricDate desc)[0..49]{
        _id, metric, value, period, metricDate, note, visibility
      }`,
      params: { acctId },
    }),
  ]);

  const myRequests = ((myRequestsRes as any)?.data ?? []) as any[];
  const supportStaff = ((supportStaffRes as any)?.data ?? []) as any[];
  const myThreads = ((myThreadsRes as any)?.data ?? []) as any[];
  const clientWorkItems = ((clientWorkItemsRes as any)?.data ?? []) as any[];
  const clientServices = ((clientServicesRes as any)?.data ?? []) as any[];
  const myServiceRequests = ((myServiceRequestsRes as any)?.data ?? []) as any[];
  const myDeliverables = ((myDeliverablesRes as any)?.data ?? []) as any[];
  const campaigns = ((activeCampaignRes as any)?.data ?? []) as any[];
  const contentItems = ((contentItemsRes as any)?.data ?? []) as any[];
  const socialConnections = ((socialConnectionsRes as any)?.data ?? []) as any[];
  const analytics = ((analyticsRes as any)?.data ?? []) as any[];
  const activeCampaign = campaigns.find((c: any) => c.status === "active") || campaigns[0];

  // Prepare calendar events
  const calendarEvents: any[] = [
    ...campaigns.map((c: any) => ({
      id: c._id,
      title: c.title,
      date: c.startDate || new Date().toISOString(),
      endDate: c.endDate,
      type: "campaign",
      status: c.status,
      description: c.description
    })),
    ...myDeliverables.map((d: any) => ({
      id: d._id,
      title: d.title,
      date: d.dueDate || d.createdAt,
      type: "deliverable",
      status: d.status,
      description: d.campaignTitle
    })).filter((e: any) => e.date), // Ensure date exists
    ...contentItems.map((c: any) => ({
      id: c._id,
      title: c.title,
      date: c.scheduledAt || new Date().toISOString(),
      type: "content",
      status: c.status,
      description: c.platform,
      platform: c.platform,
      postType: c.postType,
    })).filter((e: any) => e.date)
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {!canWrite ? (
        <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating ? "Impersonation mode: actions are read-only." : "Missing SANITY_API_WRITE_TOKEN: messaging updates are disabled."}
        </div>
      ) : null}

      <ClientView
        data={{
          user: { name, email: emailLower, id: acctId, avatar: (effectiveAcct as any)?.avatar },
          account: effectiveAcct,
          myRequests,
          supportStaff,
          myThreads,
          clientWorkItems,
          clientServices,
          myServiceRequests,
          myDeliverables,
          activeCampaign,
          calendarEvents,
          contentItems,
          socialConnections,
          analytics,
        }}
        actions={{
          submitClientRequest,
          addClientRequestMessage,
          createOrOpenSupportThread,
          setClientServiceEnabled,
          submitServiceRequest,
          approveDeliverable: async (formData) => { await approveDeliverable(formData); },
          rejectDeliverable: async (formData) => { await rejectDeliverable(formData); },
          suggestBrandAssetTags,
        }}
        capabilities={{
          canWrite,
          canViewServices,
        }}
      />
    </div>
  );
}
