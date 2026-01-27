"use server";

import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasAccountCapability } from "@/lib/capabilities";

const IMPERSONATE_COOKIE = "impersonateAccountId";

function normalizeIdList(input: unknown): string[] {
  return String(input || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isDeliverableBriefUnclear(deliverable: any): boolean {
  const typeRaw = deliverable?.type;
  const type = typeof typeRaw === "string" ? typeRaw : "";

  const hook = deliverable?.hook;
  const script = deliverable?.script;
  const visual = deliverable?.visualDirection;
  const creativeGoal = deliverable?.creativeGoal;
  const contentConcept = deliverable?.contentConcept;
  const assets = Array.isArray(deliverable?.assets) ? deliverable.assets : [];

  const missingHook = !hasText(hook);
  const missingScript = !hasText(script);
  const missingVisual = !hasText(visual);
  const missingCreativeGoal = !hasText(creativeGoal);
  const missingContentConcept = !hasText(contentConcept);
  const missingAssets = assets.length === 0;

  const isVideo =
    type === "reel" ||
    type === "video_long" ||
    type.toLowerCase().includes("video");

  if (isVideo) {
    return missingHook || missingScript || missingVisual || missingAssets;
  }

  return missingHook || missingCreativeGoal || missingContentConcept || missingAssets;
}

export async function createScheduleItem(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || String(acct.status || "") === "disabled") return;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startsAtRaw = String(formData.get("startsAt") || "").trim();
  const endsAtRaw = String(formData.get("endsAt") || "").trim();
  const visibility = String(formData.get("visibility") || "internal").trim();
  const type = String(formData.get("type") || "personal").trim();
  const participantIds = normalizeIdList(formData.get("participantIds"));
  const relatedDeliverableId = String(formData.get("relatedDeliverableId") || "").trim();
  if (!title) return;
  if (!["internal", "client"].includes(visibility)) return;
  if (!["personal", "team", "campaign", "deadline", "availability"].includes(type)) return;

  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  if (!startsAt || Number.isNaN(startsAt.getTime())) return;
  if (endsAt && Number.isNaN(endsAt.getTime())) return;
  if (endsAt && endsAt.getTime() < startsAt.getTime()) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken });

  if (relatedDeliverableId) {
    const deliverable = await writeClient.fetch(
      `*[_type == "deliverable" && _id == $id][0]{
        status,
        type,
        hook,
        script,
        visualDirection,
        creativeGoal,
        contentConcept,
        assets
      }`,
      { id: relatedDeliverableId },
    );
    const status = String(deliverable?.status || "");
    if (!["approved", "scheduled"].includes(status)) return;
    if (isDeliverableBriefUnclear(deliverable)) return;
  }

  const isAdmin = String(acct.type || "") === "admin";
  const isManager = String(acct.type || "") === "manager";
  const isEmployee = String(acct.type || "") === "employee";

  const requestedParticipants = participantIds.slice(0, 50);
  const wantsParticipants = requestedParticipants.length > 0;

  let participants: Array<{ _type: "reference"; _ref: string }> = [];

  if (isEmployee) {
    if (!hasAccountCapability(acct, "calendar.create.own")) return;
    participants = [{ _type: "reference", _ref: String(acct._id) }];
    if (visibility !== "internal") return;
  } else if (isManager) {
    if (!hasAccountCapability(acct, "calendar.team.create")) return;
    if (!wantsParticipants) {
      participants = [{ _type: "reference", _ref: String(acct._id) }];
    } else {
      if (!hasAccountCapability(acct, "calendar.team.assign")) return;
      const targets: Array<{ _id: string; status: string; type: string }> = await writeClient.fetch(
        `*[_type == "account" && _id in $ids]{_id, status, type}`,
        { ids: requestedParticipants },
      );
      const allowed = (targets ?? [])
        .filter((t) => String(t.status || "") !== "disabled")
        .filter((t) => ["admin", "manager", "employee"].includes(String(t.type || "")))
        .map((t) => ({ _type: "reference" as const, _ref: String(t._id) }));
      participants = allowed.length ? allowed : [{ _type: "reference", _ref: String(acct._id) }];
    }
    if (visibility !== "internal") return;
  } else if (isAdmin) {
    if (!hasAccountCapability(acct, "calendar.create")) return;
    if (visibility !== "internal" && !hasAccountCapability(acct, "calendar.assign")) return;
    if (!wantsParticipants) {
      participants = [{ _type: "reference", _ref: String(acct._id) }];
    } else {
      if (!hasAccountCapability(acct, "calendar.assign")) return;
      const targets: Array<{ _id: string; status: string }> = await writeClient.fetch(
        `*[_type == "account" && _id in $ids]{_id, status}`,
        { ids: requestedParticipants },
      );
      const allowed = (targets ?? [])
        .filter((t) => String(t.status || "") !== "disabled")
        .map((t) => ({ _type: "reference" as const, _ref: String(t._id) }));
      participants = allowed.length ? allowed : [{ _type: "reference", _ref: String(acct._id) }];
    }
  } else {
    return;
  }

  await writeClient.create({
    _type: "scheduleItem",
    title,
    description: description || undefined,
    type,
    visibility,
    startsAt: startsAt.toISOString(),
    ...(endsAt ? { endsAt: endsAt.toISOString() } : {}),
    participants,
    ...(relatedDeliverableId
      ? {
          relatedDeliverable: { _type: "reference" as const, _ref: relatedDeliverableId },
        }
      : {}),
    createdBy: { _type: "reference", _ref: String(acct._id) },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (relatedDeliverableId) {
    await writeClient
      .patch(relatedDeliverableId)
      .set({ 
        status: "scheduled",
        scheduledAt: startsAt.toISOString(),
        _updatedAt: new Date().toISOString() 
      })
      .commit();
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/admin");
  // Don't redirect if called from admin dashboard, or handle it on client
  // But for now, we'll assume this is fine or we might need to adjust redirection
  // If we are in admin view, we probably don't want to redirect to /dashboard/calendar
}

export async function updateScheduleItem(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || String(acct.status || "") === "disabled") return;

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const visibility = String(formData.get("visibility") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const participantIds = normalizeIdList(formData.get("participantIds"));
  const startsAtRaw = String(formData.get("startsAt") || "").trim();
  const endsAtRaw = String(formData.get("endsAt") || "").trim();
  if (!id || !title) return;
  if (visibility && !["internal", "client"].includes(visibility)) return;
  if (type && !["personal", "team", "campaign", "deadline", "availability"].includes(type)) return;

  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  if (!startsAt || Number.isNaN(startsAt.getTime())) return;
  if (endsAt && Number.isNaN(endsAt.getTime())) return;
  if (endsAt && endsAt.getTime() < startsAt.getTime()) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken });

  const existing = await writeClient.fetch(
    `*[_type == "scheduleItem" && _id == $id][0]{
      _id, 
      visibility, 
      "createdById": createdBy->_id, 
      "participantRefs": participants[]._ref,
      relatedDeliverable
    }`,
    { id },
  );
  if (!existing?._id) return;
  const creatorId = String(existing?.createdById || "");
  const existingVisibility = String(existing?.visibility || "");
  const existingParticipantRefs = Array.isArray(existing?.participantRefs) ? (existing.participantRefs as string[]) : [];
  const relatedDeliverableRef = existing.relatedDeliverable?._ref;

  const isAdmin = String(acct.type || "") === "admin";
  const isManager = String(acct.type || "") === "manager";
  const isEmployee = String(acct.type || "") === "employee";

  if (isManager && existingVisibility !== "internal") return;
  if (isEmployee && existingVisibility !== "internal") return;

  const wantsParticipants = participantIds.length > 0;
  let participantsPatch: Array<{ _type: "reference"; _ref: string }> | null = null;

  if (isAdmin) {
    if (!hasAccountCapability(acct, "calendar.update")) return;
    if (wantsParticipants || visibility === "client") {
      if (!hasAccountCapability(acct, "calendar.assign")) return;
    }
    if (wantsParticipants) {
      const targets: Array<{ _id: string; status: string }> = await writeClient.fetch(
        `*[_type == "account" && _id in $ids]{_id, status}`,
        { ids: participantIds.slice(0, 50) },
      );
      const allowed = (targets ?? [])
        .filter((t) => String(t.status || "") !== "disabled")
        .map((t) => ({ _type: "reference" as const, _ref: String(t._id) }));
      participantsPatch = allowed.length ? allowed : null;
    }
  } else if (isManager) {
    if (!hasAccountCapability(acct, "calendar.team.update")) return;
    if (wantsParticipants) {
      if (!hasAccountCapability(acct, "calendar.team.assign")) return;
      const targets: Array<{ _id: string; status: string; type: string }> = await writeClient.fetch(
        `*[_type == "account" && _id in $ids]{_id, status, type}`,
        { ids: participantIds.slice(0, 50) },
      );
      const allowed = (targets ?? [])
        .filter((t) => String(t.status || "") !== "disabled")
        .filter((t) => ["admin", "manager", "employee"].includes(String(t.type || "")))
        .map((t) => ({ _type: "reference" as const, _ref: String(t._id) }));
      participantsPatch = allowed.length ? allowed : null;
    }
    if (visibility && visibility !== "internal") return;
  } else if (isEmployee) {
    if (!hasAccountCapability(acct, "calendar.update.own")) return;
    if (creatorId !== String(acct._id || "")) return;
    if (visibility && visibility !== "internal") return;
    if (wantsParticipants) return;
  } else {
    return;
  }

  const nextVisibility = visibility || existingVisibility || "internal";
  const patch: Record<string, unknown> = {
    title,
    startsAt: startsAt.toISOString(),
    ...(endsAt ? { endsAt: endsAt.toISOString() } : { endsAt: null }),
    ...(type ? { type } : {}),
    visibility: nextVisibility,
    ...(description ? { description } : { description: null }),
    updatedAt: new Date().toISOString(),
  };

  if (participantsPatch && participantsPatch.length) {
    patch.participants = participantsPatch;
  } else if (wantsParticipants) {
    return;
  } else if (!existingParticipantRefs.length) {
    patch.participants = [{ _type: "reference", _ref: String(acct._id) }];
  }

  const transaction = writeClient.transaction();
  transaction.patch(id, (p) => p.set(patch));

  if (relatedDeliverableRef) {
    transaction.patch(relatedDeliverableRef, (p) =>
      p.set({
        scheduledAt: startsAt.toISOString(),
        _updatedAt: new Date().toISOString(),
      })
    );
  }

  await transaction.commit();

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/admin");
}

export async function deleteScheduleItem(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || String(acct.status || "") === "disabled") return;
  if (!hasAccountCapability(acct, "calendar.delete")) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken });

  const item = await writeClient.fetch(`*[_type == "scheduleItem" && _id == $id][0]{relatedDeliverable}`, { id });
  const relatedDeliverableRef = item?.relatedDeliverable?._ref;

  const transaction = writeClient.transaction();
  transaction.delete(id);

  if (relatedDeliverableRef) {
    transaction.patch(relatedDeliverableRef, (p) =>
      p
        .set({ status: "approved", _updatedAt: new Date().toISOString() })
        .unset(["scheduledAt"])
    );
  }

  await transaction.commit();

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/admin");
}

export async function requestDateChange(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || String(acct.status || "") === "disabled") return;
  if (String(acct.type || "") !== "client") return;
  if (!hasAccountCapability(acct, "calendar.date_change.request")) return;

  const scheduleItemId = String(formData.get("scheduleItemId") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!scheduleItemId || !message) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken });

  const item = await writeClient.fetch(
    `*[_type == "scheduleItem" && _id == $id && visibility == "client" && $acctId in participants[]._ref][0]{_id}`,
    { id: scheduleItemId, acctId: String(acct._id) },
  );
  if (!item?._id) return;

  await writeClient
    .patch(scheduleItemId)
    .set({
      changeRequested: true,
      changeRequestNote: message,
      updatedAt: new Date().toISOString(),
    })
    .commit();

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/admin");
}
