import Link from "next/link";
import { Cpu } from "lucide-react";
import Logo from "@/components/logo";
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import { ModeToggle } from "@/components/menu-toggle";
import { buttonVariants } from "@/components/ui/button";
import { fetchSanitySettings, fetchSanityNavigation } from "@/sanity/lib/fetch";
import { safeGetServerSession } from "@/lib/auth";
import SignOutButton from "@/components/auth/signout-button";
import LanguageSelector from "@/components/language-selector";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function Header() {
  const settings = await fetchSanitySettings();
  const navigation = await fetchSanityNavigation();
  const session = await safeGetServerSession();
  const role = String((session as any)?.type || "");
  const canAccessStudio = role === "admin";
  const isLoggedIn = Boolean(session);
  const locale = await getLocale();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-background text-[var(--header-foreground)] shadow-none">
      <div className="w-full px-6 flex h-16 items-center justify-between">
        <Link href="/" aria-label="Home page">
          <div className="flex items-center">
            <Logo settings={settings} className="h-5 w-auto" />
          </div>
        </Link>
        <div className="hidden xl:flex gap-7 items-center justify-between">
          {!isLoggedIn && <DesktopNav navigation={navigation} />}
          <div className="flex items-center gap-3">
            <ModeToggle />
            <LanguageSelector initialLang={locale} />
            {canAccessStudio ? (
              <>
                <Link
                  href="/studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-10 px-5 rounded-[33px] border-0 bg-transparent font-semibold text-[color:var(--primary)] hover:bg-muted/40 shadow-none flex items-center gap-2"
                  )}
                >
                  <Cpu className="h-4 w-4" />
                  Studio
                </Link>
                <SignOutButton
                  variant="outline"
                  size="sm"
                  triggerClassName="border-0 bg-transparent shadow-none hover:bg-muted/40"
                />
              </>
            ) : isLoggedIn ? (
              <SignOutButton
                variant="outline"
                size="sm"
                triggerClassName="border-0 bg-transparent shadow-none hover:bg-muted/40"
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "border-0 bg-transparent shadow-none hover:bg-muted/40"
                  )}
                >
                  {t("signInTitle", locale)}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 xl:hidden">
          <ModeToggle />
          <LanguageSelector initialLang={locale} />
          {!isLoggedIn && (
            <MobileNav
              navigation={navigation}
              settings={settings}
              canAccessStudio={canAccessStudio}
              isLoggedIn={isLoggedIn}
            />
          )}
        </div>
      </div>
    </header>
  );
}
