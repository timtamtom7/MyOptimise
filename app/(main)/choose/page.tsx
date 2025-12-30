import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChoosePage(props: { searchParams?: Promise<{ next?: string }> }) {
  const sp = (await props.searchParams) || {};
  const next = sp.next || "";
  redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
}
