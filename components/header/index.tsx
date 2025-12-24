import Link from "next/link";
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
import { t, getLocale } from "@/lib/i18n";

export default async function Header() {
  const settings = await fetchSanitySettings();
  const navigation = await fetchSanityNavigation();
  const session = await safeGetServerSession();
  const isAdmin = Boolean((session as any)?.isAdmin);
  const isLoggedIn = Boolean(session);
  const locale = await getLocale();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-background text-[var(--header-foreground)] shadow-none">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Home page">
          <Logo settings={settings} />
        </Link>
        <div className="hidden xl:flex gap-7 items-center justify-between">
          {!isLoggedIn && <DesktopNav navigation={navigation} />}
          <div className="flex items-center gap-3">
            <ModeToggle />
            <LanguageSelector />
            {isAdmin ? (
              <>
                <Link
                  href="/studio"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "border-0 bg-transparent shadow-none hover:bg-muted/40"
                  )}
                >
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
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "border-0 shadow-sm"
                  )}
                >
                  {t("signUpTitle", locale)}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 xl:hidden">
          <ModeToggle />
          <LanguageSelector />
          {!isLoggedIn && (
            <MobileNav
              navigation={navigation}
              settings={settings}
              isAdmin={isAdmin}
              isLoggedIn={isLoggedIn}
            />
          )}
        </div>
      </div>
    </header>
  );
}
