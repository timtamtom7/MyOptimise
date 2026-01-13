import Footer from "@/components/footer";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import { SanityLive } from "@/sanity/lib/live";
import { ModeToggle } from "@/components/menu-toggle";
import LanguageSelector from "@/components/language-selector";
import { getLocale } from "@/lib/i18n-server";

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDraftMode = (await draftMode()).isEnabled;
  const allowVisualEditing = process.env.NODE_ENV !== "development";
  const locale = await getLocale();

  return (
    <>
      <div className="fixed top-0 left-0 p-6 z-50">
        <ModeToggle />
      </div>
      <div className="fixed top-0 right-0 p-6 z-50">
        <LanguageSelector initialLang={locale} />
      </div>
      
      <main className="min-h-screen">{children}</main>
      
      <SanityLive />
      {isDraftMode && allowVisualEditing && (
        <>
          <DisableDraftMode />
          <VisualEditing />
        </>
      )}
      <Footer />
    </>
  );
}
