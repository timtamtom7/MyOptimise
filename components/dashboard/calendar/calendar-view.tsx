"use client";

import { createScheduleItem, updateScheduleItem, deleteScheduleItem, requestDateChange } from "@/app/actions/calendar";

function toDatetimeLocalValue(iso: unknown): string {
  const raw = String(iso || "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface CalendarViewProps {
  items: any[];
  effectiveAcct: any;
  effectiveType: string;
  isImpersonating: boolean;
  canWrite: boolean;
  canCreate: boolean;
  canUpdateAny: boolean;
  canUpdateTeam: boolean;
  canUpdateOwn: boolean;
  canDeleteAny: boolean;
  canRequestDateChange: boolean;
  allowParticipantIds: boolean;
  allowClientVisibility: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  isClient: boolean;
  acctId: string;
  initialDeliverable?: any;
}

export function CalendarView({
  items,
  effectiveAcct,
  effectiveType,
  isImpersonating,
  canWrite,
  canCreate,
  canUpdateAny,
  canUpdateTeam,
  canUpdateOwn,
  canDeleteAny,
  canRequestDateChange,
  allowParticipantIds,
  allowClientVisibility,
  isAdmin,
  isManager,
  isEmployee,
  isClient,
  acctId,
  initialDeliverable,
}: CalendarViewProps) {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Calendar</h2>
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
          {typeof initialDeliverable === "object" && initialDeliverable && (
            <div className="mt-1 text-xs text-muted-foreground">
              Scheduling for: <span className="font-medium">{String(initialDeliverable.title || "Deliverable")}</span>
            </div>
          )}
          <form action={createScheduleItem} className="mt-3 grid gap-3 max-w-2xl">
            {typeof initialDeliverable === "object" && initialDeliverable?._id ? (
              <input type="hidden" name="relatedDeliverableId" value={String(initialDeliverable._id)} />
            ) : null}
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="calTitle">
                Title
              </label>
              <input
                id="calTitle"
                name="title"
                required
                className="rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite}
                defaultValue={
                  typeof initialDeliverable === "object" && initialDeliverable
                    ? String(initialDeliverable.title || "")
                    : ""
                }
              />
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
