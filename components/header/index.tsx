import Link from "next/link";
import Logo from "@/components/logo";
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import { ModeToggle } from "@/components/menu-toggle";
import { fetchSanitySettings, fetchSanityNavigation } from "@/sanity/lib/fetch";
import { safeGetServerSession } from "@/lib/auth";
import SignOutButton from "@/components/auth/signout-button";
import LanguageSelector from "@/components/language-selector";
import { t, getLocale } from "@/lib/i18n";

export default async function Header() {
  const settings = await fetchSanitySettings();
  const navigation = await fetchSanityNavigation();
  const session = await safeGetServerSession();
  const isAdmin = Boolean((session as any)?.isAdmin);
  const isLoggedIn = Boolean(session);
  const locale = await getLocale();
  return (
    <header className="sticky top-0 w-full border-border/40 bg-background/95 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
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
                <Link href="/studio" className="rounded-md border px-3 py-2">
                  Studio
                </Link>
                <SignOutButton variant="outline" size="lg" />
              </>
            ) : isLoggedIn ? (
              <SignOutButton variant="outline" size="lg" />
            ) : (
              <>
                <Link href="/login" className="rounded-md border px-3 py-2">
                  {t("signInTitle", locale)}
                </Link>
                <Link href="/signup" className="rounded-md bg-primary px-3 py-2 text-primary-foreground">
                  {t("signUpTitle", locale)}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center xl:hidden">
          <ModeToggle />
          <LanguageSelector />
          {!isLoggedIn && <MobileNav navigation={navigation} settings={settings} isAdmin={isAdmin} isLoggedIn={isLoggedIn} />}
        </div>
      </div>
    </header>
  );
}
