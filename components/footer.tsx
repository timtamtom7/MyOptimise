import Logo from "@/components/logo";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { fetchSanitySettings } from "@/sanity/lib/fetch";

export default async function Footer() {
  const settings = await fetchSanitySettings();

  return (
    <footer>
      <div className="dark:bg-background pb-5 xl:pb-5 dark:text-gray-300 text-center">
        <Link
          href="/"
          className="inline-block text-center"
          aria-label="Home page"
        >
          <Logo settings={settings} />
        </Link>
        <div className="mt-8 flex flex-row gap-6 justify-center lg:mt-5 text-xs border-t pt-8">
          <div className="flex items-center gap-2 text-foreground/60">
            <span>&copy; {new Date().getFullYear()}</span>
            {settings?.copyright && (
              <span className="[&>p]:!m-0">
                <PortableTextRenderer value={settings.copyright} />
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
