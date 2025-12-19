import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function MissingSanityPage({
  document,
  slug,
}: {
  document: string;
  slug: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container max-w-xl text-center">
        <h1 className="text-2xl">
          Missing{" "}
          <Badge variant="outline" className="text-lg">
            {document}
          </Badge>{" "}
          document with slug{" "}
          <Badge variant="outline" className="text-lg">
            {slug}
          </Badge>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Create it in Sanity Studio or browse available sections below.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/studio"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Open Studio
          </Link>
          <Link href="/events" className="rounded-md border px-4 py-2">
            View Events
          </Link>
          <Link href="/organizations" className="rounded-md border px-4 py-2">
            View Organizations
          </Link>
        </div>
      </div>
    </div>
  );
}
