import { fetchSanitySettings } from "@/sanity/lib/fetch";

export default async function Footer() {
  const settings = await fetchSanitySettings();

  return (
    <footer>
      <div className="dark:bg-background pb-5 xl:pb-5 dark:text-gray-300 text-center">
        <div className="mt-8 flex flex-row gap-6 justify-center lg:mt-5 text-xs border-t pt-8">
          <div className="flex items-center gap-2 text-foreground/60">
            <span>&copy; {new Date().getFullYear()}</span>
            {settings?.copyright && (
              <span>{settings.copyright}</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
