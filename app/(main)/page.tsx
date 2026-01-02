import Link from "next/link";
import { Button } from "@/components/ui/button";
import { safeGetServerSession } from "@/lib/auth";
import { t, getLocale } from "@/lib/i18n";
import { fetchSanitySettings } from "@/sanity/lib/fetch";
import Logo from "@/components/logo";
import { sanityFetch } from "@/sanity/lib/live";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const session = await safeGetServerSession();
  const locale = await getLocale();
  const role = String((session as any)?.type || "");
  const canAccessStudio = role === "admin";
  const settings = await fetchSanitySettings();

  if (!session) {
    const clientCtaUrl = settings?.clientCta?.url || "https://OptimiseOperations.com";
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
        <div className="container flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-2xl text-center">
            <div className="text-sm font-medium text-muted-foreground">Welcome to</div>
            <div className="mt-4 flex justify-center">
              <Logo settings={settings} className="h-20 w-auto md:h-28" />
            </div>
            <p className="mt-6 text-base text-muted-foreground">
              MyOptimise internal workspace for Optimise employees to manage tasks, updates, and approvals.
            </p>
            <div className="mt-8 flex justify-center">
              <Button asChild className="rounded-2xl px-10">
                <Link href="/login">{t("continueWithGoogle", locale)}</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href={clientCtaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-[85vw] items-center gap-1.5 rounded-full border border-blue-500 bg-white px-3 py-1.5 text-[11px] font-medium leading-none text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
          >
            <span className="truncate whitespace-nowrap">
              Are you a client or brand? Visit OptimiseOperations.com
            </span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    );
  }

  const fullName = String((session as any)?.user?.name || "");
  const firstName = fullName.includes(" ") ? fullName.split(" ")[0] : fullName;
  const email = String((session as any)?.user?.email || "");
  const [clientsCountRes, teamCountRes, requestsCountRes] = await Promise.all([
    sanityFetch({ query: 'count(*[_type == "account" && type == "client"])' }),
    sanityFetch({ query: 'count(*[_type == "account" && status != "disabled"])' }),
    sanityFetch({ query: 'count(*[_type == "signup"])' }),
  ]);
  const clientsCount = Number((clientsCountRes as any)?.data ?? 0);
  const teamCount = Number((teamCountRes as any)?.data ?? 0);
  const requestsCount = Number((requestsCountRes as any)?.data ?? 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container py-12">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm text-muted-foreground">
              {email ? `Signed in as ${email}` : "Signed in"}
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Hey{firstName ? `, ${firstName}` : ""} 👋
            </h1>
            <p className="mt-3 text-muted-foreground">{t("heroSubLoggedIn", locale)}</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button asChild className="rounded-2xl px-6">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            {canAccessStudio ? (
              <Button asChild variant="outline" className="rounded-2xl px-6">
                <Link href="/studio">Studio</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border p-5">
            <div className="text-sm text-muted-foreground">Tasks</div>
            <div className="mt-2 text-3xl font-semibold">—</div>
            <div className="mt-2 text-sm text-muted-foreground">Dashboard is next.</div>
          </div>
          <div className="rounded-2xl border p-5">
            <div className="text-sm text-muted-foreground">Clients</div>
            <div className="mt-2 text-3xl font-semibold">{clientsCount}</div>
            <div className="mt-2 text-sm text-muted-foreground">From Sanity</div>
          </div>
          <div className="rounded-2xl border p-5">
            <div className="text-sm text-muted-foreground">Requests</div>
            <div className="mt-2 text-3xl font-semibold">{requestsCount}</div>
            <div className="mt-2 text-sm text-muted-foreground">From Sanity</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">Active team members: {teamCount}</div>

        <div className="mt-8 flex flex-col gap-3 md:hidden">
          <Button asChild className="rounded-2xl px-6">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          {canAccessStudio ? (
            <Button asChild variant="outline" className="rounded-2xl px-6">
              <Link href="/studio">Studio</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
