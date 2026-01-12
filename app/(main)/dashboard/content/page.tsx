import { fetchContentItems } from "@/sanity/lib/fetch";
import { ContentBoard } from "@/components/content/ContentBoard";

export const metadata = {
  title: "Content Engine | Optimise",
};

export default async function ContentPage() {
  const items = await fetchContentItems();
  
  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold">Content Engine</h1>
      </div>
      <ContentBoard items={items} />
    </div>
  );
}
