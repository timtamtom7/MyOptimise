import { safeGetServerSession, IMPERSONATE_COOKIE_NAME } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = IMPERSONATE_COOKIE_NAME;

function normalizeIdList(input: unknown): string[] {
  return String(input || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

export default async function DashboardDocumentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const folderParam = typeof searchParams.folder === "string" ? searchParams.folder : "";

  const session = await safeGetServerSession();
  if (!session) redirect("/login?next=/dashboard/documents");

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  if (!acct) redirect("/login?error=no_account&next=/dashboard/documents");
  if (String(acct.status || "") === "disabled") redirect("/login?error=disabled&next=/dashboard/documents");

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = String(acct?.type || (session as any)?.type || "").toLowerCase();
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
      effectiveType = String(target.type || "").toLowerCase();
      isImpersonating = true;
    }
  }

  if (!hasAccountCapability(effectiveAcct, "documents.view.shared")) redirect("/dashboard");

  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;
  const canUpload = hasAccountCapability(effectiveAcct, "documents.upload");
  const canShareTeam = hasAccountCapability(effectiveAcct, "documents.share.team");
  const canShareClients = hasAccountCapability(effectiveAcct, "documents.share.clients");
  const canSetPermissions = hasAccountCapability(effectiveAcct, "documents.permissions.set");
  const canDownload =
    hasAccountCapability(effectiveAcct, "documents.download") || hasAccountCapability(effectiveAcct, "documents.download.deliverables");

  const acctId = String(effectiveAcct._id || "");
  const isClient = effectiveType === "client";

  async function uploadDocument(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || String(acct.status || "") === "disabled") return;
    if (!hasAccountCapability(acct, "documents.upload")) return;

    const title = String(formData.get("title") || "").trim();
    const folder = String(formData.get("folder") || "").trim();
    const visibility = String(formData.get("visibility") || "internal").trim();
    const shareWithIds = normalizeIdList(formData.get("shareWithIds"));
    const docFile = formData.get("file");
    if (!title) return;
    if (!docFile || typeof docFile === "string") return;
    const file = docFile as File;
    if (!file.size) return;
    if (!["internal", "client"].includes(visibility)) return;
    if (visibility !== "internal" && !hasAccountCapability(acct, "documents.share.clients")) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const asset = await writeClient.assets.upload("file", file, { filename: file.name });
    const uploadedAssetId = String(asset?._id || "");
    if (!uploadedAssetId) return;

    const requestedShares = shareWithIds.slice(0, 50);
    let sharedWith: Array<{ _type: "reference"; _ref: string }> = [];
    if (requestedShares.length) {
      const targets: Array<{ _id: string; type: string; status: string }> = await writeClient.fetch(
        `*[_type == "account" && _id in $ids]{_id, type, status}`,
        { ids: requestedShares },
      );
      const allowed = (targets ?? [])
        .filter((t) => String(t.status || "") !== "disabled")
        .filter((t) => {
          const tType = String(t.type || "");
          const isTargetClient = tType === "client";
          return isTargetClient ? hasAccountCapability(acct, "documents.share.clients") : hasAccountCapability(acct, "documents.share.team");
        })
        .map((t) => ({ _type: "reference" as const, _ref: String(t._id) }));
      sharedWith = allowed;
    }

    await writeClient.create({
      _type: "documentItem",
      title,
      ...(folder ? { folder } : {}),
      visibility,
      file: { _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } },
      sharedWith,
      createdBy: { _type: "reference", _ref: String(acct._id) },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/dashboard/documents");
    redirect("/dashboard/documents");
  }

  async function updateDocumentSharing(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || String(acct.status || "") === "disabled") return;

    const id = String(formData.get("id") || "").trim();
    const visibility = String(formData.get("visibility") || "").trim();
    const shareWithIds = normalizeIdList(formData.get("shareWithIds"));
    if (!id) return;
    if (visibility && !["internal", "client"].includes(visibility)) return;

    if (!hasAccountCapability(acct, "documents.permissions.set")) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const existing = await writeClient.fetch(
      `*[_type == "documentItem" && _id == $id][0]{_id, createdBy->{_id}}`,
      { id },
    );
    if (!existing?._id) return;
    const creatorId = String(existing?.createdBy?._id || "");
    const isOwner = creatorId && creatorId === String(acct._id || "");
    if (!isOwner && acct.type !== "admin") return;

    const requestedShares = shareWithIds.slice(0, 50);
    let sharedWith: Array<{ _type: "reference"; _ref: string }> = [];
    if (requestedShares.length) {
      const targets: Array<{ _id: string; type: string; status: string }> = await writeClient.fetch(
        `*[_type == "account" && _id in $ids]{_id, type, status}`,
        { ids: requestedShares },
      );
      const allowed = (targets ?? [])
        .filter((t) => String(t.status || "") !== "disabled")
        .filter((t) => {
          const tType = String(t.type || "");
          const isTargetClient = tType === "client";
          return isTargetClient ? hasAccountCapability(acct, "documents.share.clients") : hasAccountCapability(acct, "documents.share.team");
        })
        .map((t) => ({ _type: "reference" as const, _ref: String(t._id) }));
      sharedWith = allowed;
    }

    const patch: Record<string, unknown> = {
      sharedWith,
      updatedAt: new Date().toISOString(),
    };
    if (visibility) {
      if (visibility !== "internal" && !hasAccountCapability(acct, "documents.share.clients")) return;
      patch.visibility = visibility;
    }
    await writeClient.patch(id).set(patch).commit();

    revalidatePath("/dashboard/documents");
    redirect("/dashboard/documents");
  }

  const [docsRes, accountsRes] = await Promise.all([
    sanityFetch({
      query: isClient
        ? `*[_type == "documentItem" && visibility == "client" && (createdBy._ref == $acctId || $acctId in sharedWith[]._ref)]
            | order(coalesce(updatedAt, createdAt) desc)[0..49]{
              _id, title, folder, visibility, createdAt, updatedAt,
              "fileUrl": file.asset->url,
              "fileName": file.asset->originalFilename,
              "sharedWith": sharedWith[]->{_id, name, email, type}
            }`
        : `*[_type == "documentItem" && (createdBy._ref == $acctId || $acctId in sharedWith[]._ref)]
            | order(coalesce(updatedAt, createdAt) desc)[0..49]{
              _id, title, folder, visibility, createdAt, updatedAt,
              "fileUrl": file.asset->url,
              "fileName": file.asset->originalFilename,
              "sharedWith": sharedWith[]->{_id, name, email, type}
            }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "account" && status != "disabled"] | order(type asc, name asc, email asc){
        _id, name, email, type
      }`,
    }),
  ]);

  const documents = ((docsRes as any)?.data ?? []) as any[];
  const accounts = ((accountsRes as any)?.data ?? []) as any[];

  const internalTargets = accounts.filter((a: any) => ["admin", "manager", "employee"].includes(String(a.type || "")));
  const clientTargets = accounts.filter((a: any) => String(a.type || "") === "client");

  const folders = Array.from(new Set(documents.map((d: any) => d.folder).filter(Boolean))).sort() as string[];

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="text-sm text-muted-foreground">{String(effectiveAcct.email || "")}</div>
      </div>

      {!canWrite ? (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating ? `Impersonation mode (${effectiveType}): actions are read-only.` : "Missing SANITY_API_WRITE_TOKEN: document updates are disabled."}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/dashboard/documents"
          className={`rounded-full border px-3 py-1 text-sm ${!folderParam ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
        >
          All
        </Link>
        {folders.map((f) => (
          <Link
            key={f}
            href={`/dashboard/documents?folder=${encodeURIComponent(f)}`}
            className={`rounded-full border px-3 py-1 text-sm ${folderParam === f ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
          >
            {f}
          </Link>
        ))}
      </div>

      {canUpload ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Upload</div>
          <form action={uploadDocument} className="mt-3 grid gap-3 max-w-2xl" encType="multipart/form-data">
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="docTitle">
                Title
              </label>
              <input id="docTitle" name="title" required className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="docFolder">
                Folder
              </label>
              <input
                id="docFolder"
                name="folder"
                list="folderOptions"
                className="rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite}
                placeholder="Select or create new folder"
              />
              <datalist id="folderOptions">
                {folders.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="docFile">
                File
              </label>
              <input id="docFile" name="file" type="file" required className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="docVisibility">
                  Visibility
                </label>
                <select
                  id="docVisibility"
                  name="visibility"
                  defaultValue="internal"
                  className="rounded-md border px-3 py-2 text-sm"
                  disabled={!canWrite || isClient}
                >
                  <option value="internal">Internal</option>
                  <option value="client">Client visible</option>
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="docShareWithIds">
                  Share with (account IDs)
                </label>
                <textarea
                  id="docShareWithIds"
                  name="shareWithIds"
                  placeholder="Paste account IDs (comma or newline separated)"
                  className="min-h-[42px] rounded-md border px-3 py-2 text-sm"
                  disabled={!canWrite || (!canShareTeam && !canShareClients)}
                />
              </div>
            </div>
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Upload
            </button>
          </form>
          {(canShareTeam || canShareClients) && (internalTargets.length || clientTargets.length) ? (
            <div className="mt-4 grid gap-3 text-xs text-muted-foreground">
              {canShareTeam && internalTargets.length ? (
                <div>
                  <div className="font-medium text-foreground">Internal accounts</div>
                  <div className="mt-1 break-all">
                    {internalTargets
                      .slice(0, 12)
                      .map((a: any) => `${String(a._id)} (${String(a.name || a.email || "")})`)
                      .join(" • ")}
                  </div>
                </div>
              ) : null}
              {canShareClients && clientTargets.length ? (
                <div>
                  <div className="font-medium text-foreground">Client accounts</div>
                  <div className="mt-1 break-all">
                    {clientTargets
                      .slice(0, 12)
                      .map((a: any) => `${String(a._id)} (${String(a.name || a.email || "")})`)
                      .join(" • ")}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Library</div>
        <div className="mt-3 space-y-3">
          {documents.map((d: any) => (
            <div key={String(d._id)} className="rounded-lg border px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{String(d.title || "")}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {String(d.folder || "") ? `Folder: ${String(d.folder)}` : ""}
                    {String(d.folder || "") ? " • " : ""}
                    {String(d.visibility || "")}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {String(d.updatedAt || d.createdAt || "") ? new Date(String(d.updatedAt || d.createdAt)).toLocaleString() : ""}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {canDownload && String(d.fileUrl || "") ? (
                    <a className="text-sm underline" href={String(d.fileUrl)} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  ) : null}
                </div>
              </div>

              {Array.isArray(d.sharedWith) && d.sharedWith.length ? (
                <div className="mt-2 text-xs text-muted-foreground break-all">
                  Shared with:{" "}
                  {d.sharedWith
                    .map((a: any) => String(a?.name || a?.email || a?._id || ""))
                    .filter(Boolean)
                    .join(", ")}
                </div>
              ) : null}

              {canSetPermissions ? (
                <form action={updateDocumentSharing} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={String(d._id)} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    <select name="visibility" defaultValue={String(d.visibility || "internal")} className="rounded-md border px-2 py-1 text-sm" disabled={!canWrite}>
                      <option value="internal">Internal</option>
                      <option value="client">Client visible</option>
                    </select>
                    <input
                      name="shareWithIds"
                      defaultValue={Array.isArray(d.sharedWith) ? d.sharedWith.map((a: any) => String(a?._id || "")).filter(Boolean).join(",") : ""}
                      placeholder="Share with account IDs"
                      className="rounded-md border px-2 py-1 text-sm"
                      disabled={!canWrite}
                    />
                  </div>
                  <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                    Update sharing
                  </button>
                </form>
              ) : null}
            </div>
          ))}
          {documents.length === 0 ? <div className="text-sm text-muted-foreground">No documents visible to you yet.</div> : null}
        </div>
      </div>
    </div>
  );
}

