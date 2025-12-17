import Link from "next/link";
import Logo from "@/components/logo";
import MobileNav from "@/components/header/mobile-nav";
import DesktopNav from "@/components/header/desktop-nav";
import { ModeToggle } from "@/components/menu-toggle";
import { fetchSanitySettings, fetchSanityNavigation } from "@/sanity/lib/fetch";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Header() {
  const settings = await fetchSanitySettings();
  const navigation = await fetchSanityNavigation();
  const session = await getServerSession(authOptions);
  const isAdmin = Boolean((session as any)?.isAdmin);
  return (
    <header className="sticky top-0 w-full border-border/40 bg-background/95 z-50">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" aria-label="Home page">
          <Logo settings={settings} />
        </Link>
        <div className="hidden xl:flex gap-7 items-center justify-between">
          <DesktopNav navigation={navigation} />
          <div className="flex items-center gap-3">
            <ModeToggle />
            {isAdmin ? (
              <Link href="/studio" className="rounded-md border px-3 py-2">
                Go to Content Management Studio
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-md border px-3 py-2">
                  Sign In
                </Link>
                <Link href="/signup" className="rounded-md bg-primary px-3 py-2 text-primary-foreground">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center xl:hidden">
          <ModeToggle />
          <MobileNav navigation={navigation} settings={settings} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
