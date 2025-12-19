import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { t, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ChoosePage(props: { searchParams?: Promise<{ next?: string }> }) {
  const session = await getServerSession(authOptions);
  const sp = (await props.searchParams) || {};
  const next = sp.next || "";
  const locale = await getLocale();
  if (session) {
    const email = (session as any)?.user?.email || "";
    const account = email ? await fetchSanityAccountByEmail({ email }) : null;
    if (account?.type === "business") {
      redirect(next || "/dashboard/business");
    }
    if (account?.type === "individual") {
      redirect(next || "/events");
    }
  }
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <h1 className="text-3xl font-semibold text-center">{t("individualOrBusinessQuestion", locale)}</h1>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Button
          variant="outline"
          className="h-40 flex flex-col items-center justify-center"
          asChild
        >
          <a href={`/login?type=individual&next=${encodeURIComponent(next || "/dashboard")}`}>
            <span className="text-xl font-medium">{t("individual", locale)}</span>
            <span className="mt-2 text-muted-foreground">{t("individualSub", locale)}</span>
          </a>
        </Button>
        <Button
          variant="outline"
          className="h-40 flex flex-col items-center justify-center"
          asChild
        >
          <a href={`/login?type=business&next=${encodeURIComponent(next || "/dashboard/business")}`}>
            <span className="text-xl font-medium">{t("business", locale)}</span>
            <span className="mt-2 text-muted-foreground">{t("businessSub", locale)}</span>
          </a>
        </Button>
      </div>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Have an account?{" "}
          <a href={`/login?next=${encodeURIComponent(next || "/")}`} className="underline">Sign in here</a>
        </p>
        <p className="mt-1">
          New here?{" "}
          <a href={`/signup`} className="underline">Sign up here</a>
        </p>
      </div>
    </div>
  );
}
