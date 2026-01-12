import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { safeGetServerSession } from "@/lib/auth";
import { t, getLocale } from "@/lib/i18n";
import { fetchSanitySettings } from "@/sanity/lib/fetch";
import Logo from "@/components/logo";
import { ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const session = await safeGetServerSession();
  const locale = await getLocale();
  const role = String((session as any)?.type || "");
  const settings = await fetchSanitySettings();

    if (!session) {
      const clientCtaUrl = settings?.clientCta?.url || "https://OptimiseOperations.com";
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
        <div className="container mx-auto flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-2xl text-center">
            <div className="text-sm font-medium text-muted-foreground">Welcome to</div>
            <div className="mt-4 flex justify-center">
              <Logo settings={settings} className="h-20 w-auto md:h-28" />
            </div>
            <p className="mt-6 text-base text-muted-foreground">
              MyOptimise internal workspace for Optimise employees to manage tasks, updates, and approvals.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className={buttonVariants({ className: "rounded-2xl px-10" })}
              >
                {t("continueWithGoogle", locale)}
              </Link>
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

  const dest =
    role === "client"
      ? "/dashboard/client"
      : role === "admin"
        ? "/dashboard/admin"
        : role === "manager"
          ? "/dashboard/manager"
          : role === "employee"
            ? "/dashboard/employee"
            : "/dashboard";
  
  redirect(dest);
}
