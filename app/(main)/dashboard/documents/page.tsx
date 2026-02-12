import { safeGetServerSession, IMPERSONATE_COOKIE_NAME } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DocumentBrowser } from "@/components/documents/document-browser";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = IMPERSONATE_COOKIE_NAME;

export default async function DashboardDocumentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
  const acctId = String(effectiveAcct._id || "");
  const isClient = effectiveType === "client";

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

  const folders = Array.from(new Set(documents.map((d: any) => d.folder).filter(Boolean))).sort() as string[];

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold">Documents</h1>
         {!canWrite && isImpersonating && (
             <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
                 Impersonation Mode: Read Only
             </div>
         )}
      </div>
      <DocumentBrowser 
        documents={documents} 
        folders={folders} 
        clients={accounts} 
        canUpload={canUpload && canWrite}
      />
    </div>
  );
}
