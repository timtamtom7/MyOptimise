import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

function normalizeIdList(input: unknown): string[] {
  return String(input || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

function toDatetimeLocalValue(iso: unknown): string {
  const raw = String(iso || "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function DashboardCalendarPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login?next=/dashboard/calendar");

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  if (!acct) redirect("/login?error=no_account&next=/dashboard/calendar");
  if (String(acct.status || "") === "disabled") redirect("/login?error=disabled&next=/dashboard/calendar");

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = String(acct?.type || (session as any)?.type || "");
  let isImpersonating = false;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status, capabilities, revokedCapabilities}`,
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

  const acctId = String(effectiveAcct._id || "");
  const isClient = effectiveType === "client";
  const isEmployee = effectiveType === "employee";
  const isManager = effectiveType === "manager";
  const isAdmin = effectiveType === "admin";

  const canViewCalendar =
    isAdmin ||
    hasAccountCapability(effectiveAcct, "calendar.view.all") ||
    hasAccountCapability(effectiveAcct, "calendar.team.view") ||
    hasAccountCapability(effectiveAcct, "calendar.view.own") ||
    hasAccountCapability(effectiveAcct, "calendar.campaign.view");

  if (!canViewCalendar) redirect("/dashboard");

  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;
  const canCreateAny = hasAccountCapability(effectiveAcct, "calendar.create");
  const canUpdateAny = hasAccountCapability(effectiveAcct, "calendar.update");
  const canDeleteAny = hasAccountCapability(effectiveAcct, "calendar.delete");
  const canAssignAny = hasAccountCapability(effectiveAcct, "calendar.assign");
  const canCreateTeam = hasAccountCapability(effectiveAcct, "calendar.team.create");
  const canUpdateTeam = hasAccountCapability(effectiveAcct, "calendar.team.update");
  const canAssignTeam = hasAccountCapability(effectiveAcct, "calendar.team.assign");
  const canCreateOwn = hasAccountCapability(effectiveAcct, "calendar.create.own");
  const canUpdateOwn = hasAccountCapability(effectiveAcct, "calendar.update.own");
  const canRequestDateChange = hasAccountCapability(effectiveAcct, "calendar.date_change.request");

  async function createScheduleItem(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || String(acct.status || "") === "disabled") return;

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const relatedDeliverableId = String(formData.get("relatedDeliverableId") || "").trim();
    const startsAtRaw = String(formData.get("startsAt") || "").trim();
    const endsAtRaw = String(formData.get("endsAt") || "").trim();
    const visibility = String(formData.get("visibility") || "internal").trim();
    const type = String(formData.get("type") || "personal").trim();
    const participantIds = normalizeIdList(formData.get("participantIds"));
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
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

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
      createdBy: { _type: "reference", _ref: String(acct._id) },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(relatedDeliverableId ? { relatedDeliverable: { _type: "reference", _ref: relatedDeliverableId } } : {}),
    });

    if (relatedDeliverableId) {
      await writeClient.patch(relatedDeliverableId).set({ scheduledAt: startsAt.toISOString() }).commit();
    }

    revalidatePath("/dashboard/calendar");
    redirect("/dashboard/calendar");
  }

  async function updateScheduleItem(formData: FormData) {
    "use server";
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
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const existing = await writeClient.fetch(
      `*[_type == "scheduleItem" && _id == $id][0]{_id, visibility, "createdById": createdBy->_id, "participantRefs": participants[]._ref}`,
      { id },
    );
    if (!existing?._id) return;
    const creatorId = String(existing?.createdById || "");
    const existingVisibility = String(existing?.visibility || "");
    const existingParticipantRefs = Array.isArray(existing?.participantRefs) ? (existing.participantRefs as string[]) : [];

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

    await writeClient
      .patch(id)
      .set(patch)
      .commit();

    revalidatePath("/dashboard/calendar");
    redirect("/dashboard/calendar");
  }

  async function deleteScheduleItem(formData: FormData) {
    "use server";
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
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
    await writeClient.delete(id);

    revalidatePath("/dashboard/calendar");
    redirect("/dashboard/calendar");
  }

  async function requestDateChange(formData: FormData) {
    "use server";
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
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

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
    redirect("/dashboard/calendar");
  }

  const [itemsRes] = await Promise.all([
    sanityFetch({
      query: isAdmin
        ? `*[_type == "scheduleItem"] | order(startsAt asc)[0..49]{
            _id, title, description, type, visibility, startsAt, endsAt, createdAt, updatedAt, changeRequested, changeRequestNote,
            "createdById": createdBy->_id,
            "participants": participants[]->{_id, name, email, type}
          }`
        : isManager
          ? `*[_type == "scheduleItem" && visibility == "internal"] | order(startsAt asc)[0..49]{
              _id, title, description, type, visibility, startsAt, endsAt, createdAt, updatedAt, changeRequested, changeRequestNote,
              "createdById": createdBy->_id,
              "participants": participants[]->{_id, name, email, type}
            }`
          : isEmployee
            ? `*[_type == "scheduleItem" && visibility == "internal" && $acctId in participants[]._ref] | order(startsAt asc)[0..49]{
                _id, title, description, type, visibility, startsAt, endsAt, createdAt, updatedAt, changeRequested, changeRequestNote,
                "createdById": createdBy->_id,
                "participants": participants[]->{_id, name, email, type}
              }`
            : isClient
              ? `*[_type == "scheduleItem" && visibility == "client" && $acctId in participants[]._ref] | order(startsAt asc)[0..49]{
                  _id, title, description, type, visibility, startsAt, endsAt, createdAt, updatedAt, changeRequested, changeRequestNote,
                  "createdById": createdBy->_id,
                  "participants": participants[]->{_id, name, email, type}
                }`
              : `[]`,
      params: { acctId },
    }),
  ]);

  const items = ((itemsRes as any)?.data ?? []) as any[];

  const canCreate = canCreateAny || canCreateTeam || canCreateOwn;
  const allowParticipantIds = (isAdmin && canAssignAny) || (isManager && canAssignTeam);
  const allowClientVisibility = isAdmin && canAssignAny;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="text-sm text-muted-foreground">{String(effectiveAcct.email || "")}</div>
      </div>

      {!canWrite ? (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating ? `Impersonation mode (${effectiveType}): actions are read-only.` : "Missing SANITY_API_WRITE_TOKEN: calendar updates are disabled."}
        </div>
      ) : null}

      {canCreate ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Create</div>
          <form action={createScheduleItem} className="mt-3 grid gap-3 max-w-2xl">
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="calTitle">
                Title
              </label>
              <input id="calTitle" name="title" required className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="calDescription">
                Description
              </label>
              <textarea id="calDescription" name="description" className="min-h-[72px] rounded-md border px-3 py-2 text-sm" disabled={!canWrite} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="calStartsAt">
                  Starts
                </label>
                <input id="calStartsAt" name="startsAt" type="datetime-local" required className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="calEndsAt">
                  Ends
                </label>
                <input id="calEndsAt" name="endsAt" type="datetime-local" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="calType">
                  Type
                </label>
                <select id="calType" name="type" defaultValue="personal" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                  <option value="personal">Personal</option>
                  <option value="team">Team</option>
                  <option value="campaign">Campaign</option>
                  <option value="deadline">Deadline</option>
                  <option value="availability">Availability</option>
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="calVisibility">
                  Visibility
                </label>
                <select
                  id="calVisibility"
                  name="visibility"
                  defaultValue="internal"
                  className="rounded-md border px-3 py-2 text-sm"
                  disabled={!canWrite || !allowClientVisibility}
                >
                  <option value="internal">Internal</option>
                  <option value="client">Client visible</option>
                </select>
              </div>
            </div>
            {allowParticipantIds ? (
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="calParticipantIds">
                  Participant IDs
                </label>
                <textarea
                  id="calParticipantIds"
                  name="participantIds"
                  placeholder="Comma or newline separated"
                  className="min-h-[42px] rounded-md border px-3 py-2 text-sm"
                  disabled={!canWrite}
                />
              </div>
            ) : null}
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Create
            </button>
          </form>
        </div>
      ) : null}

      {isClient && canRequestDateChange ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Client</div>
          <div className="mt-2 text-2xl font-medium">Request a date change</div>
          <form action={requestDateChange} className="mt-3 grid gap-3 max-w-2xl">
            <select name="scheduleItemId" defaultValue="" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              <option value="" disabled>
                Choose a schedule item…
              </option>
              {items.map((i: any) => (
                <option key={String(i._id)} value={String(i._id)}>
                  {String(i.title || i._id)}
                </option>
              ))}
            </select>
            <textarea name="message" required className="min-h-[110px] rounded-md border px-3 py-2 text-sm" disabled={!canWrite} />
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Submit request
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Upcoming</div>
        <div className="mt-3 space-y-3">
          {items.map((i: any) => {
            const createdById = String(i.createdById || "");
            const canEditThis =
              (isAdmin && canUpdateAny) ||
              (isManager && canUpdateTeam) ||
              (isEmployee && canUpdateOwn && createdById && createdById === acctId);
            return (
              <div key={String(i._id)} className="rounded-lg border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{String(i.title || "")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {String(i.type || "")} • {String(i.visibility || "")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {String(i.startsAt || "") ? new Date(String(i.startsAt)).toLocaleString() : ""}
                      {String(i.endsAt || "") ? ` → ${new Date(String(i.endsAt)).toLocaleString()}` : ""}
                    </div>
                    {String(i.description || "") ? <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{String(i.description)}</div> : null}
                    {i.changeRequested ? (
                      <div className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700 border border-amber-200">
                        <strong>Change Requested:</strong> {String(i.changeRequestNote || "")}
                      </div>
                    ) : null}
                    {Array.isArray(i.participants) && i.participants.length ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Participants:{" "}
                        {i.participants
                          .map((p: any) => String(p?.name || p?.email || ""))
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    ) : null}
                  </div>
                </div>

                {canEditThis ? (
                  <form action={updateScheduleItem} className="mt-3 grid gap-2">
                    <input type="hidden" name="id" value={String(i._id)} />
                    <input name="title" defaultValue={String(i.title || "")} className="rounded-md border px-2 py-1 text-sm" disabled={!canWrite} />
                    <textarea
                      name="description"
                      defaultValue={String(i.description || "")}
                      className="min-h-[64px] rounded-md border px-2 py-1 text-sm"
                      disabled={!canWrite}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      <input
                        name="startsAt"
                        type="datetime-local"
                        required
                        defaultValue={toDatetimeLocalValue(i.startsAt)}
                        className="rounded-md border px-2 py-1 text-sm"
                        disabled={!canWrite}
                      />
                      <input
                        name="endsAt"
                        type="datetime-local"
                        defaultValue={toDatetimeLocalValue(i.endsAt)}
                        className="rounded-md border px-2 py-1 text-sm"
                        disabled={!canWrite}
                      />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      <select name="type" defaultValue={String(i.type || "personal")} className="rounded-md border px-2 py-1 text-sm" disabled={!canWrite}>
                        <option value="personal">Personal</option>
                        <option value="team">Team</option>
                        <option value="campaign">Campaign</option>
                        <option value="deadline">Deadline</option>
                        <option value="availability">Availability</option>
                      </select>
                      <select
                        name="visibility"
                        defaultValue={String(i.visibility || "internal")}
                        className="rounded-md border px-2 py-1 text-sm"
                        disabled={!canWrite || !allowClientVisibility}
                      >
                        <option value="internal">Internal</option>
                        <option value="client">Client visible</option>
                      </select>
                    </div>
                    {allowParticipantIds ? (
                      <textarea
                        name="participantIds"
                        placeholder="Comma or newline separated"
                        defaultValue={Array.isArray(i.participants) ? i.participants.map((p: any) => String(p?._id || "")).filter(Boolean).join(", ") : ""}
                        className="min-h-[42px] rounded-md border px-2 py-1 text-sm"
                        disabled={!canWrite}
                      />
                    ) : null}
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                      Update
                    </button>
                  </form>
                ) : null}

                {isAdmin && canDeleteAny ? (
                  <form action={deleteScheduleItem} className="mt-2">
                    <input type="hidden" name="id" value={String(i._id)} />
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
          {items.length === 0 ? <div className="text-sm text-muted-foreground">No schedule items yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
