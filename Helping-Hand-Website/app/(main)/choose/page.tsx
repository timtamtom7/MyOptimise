 "use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ChoosePage() {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <h1 className="text-3xl font-semibold text-center">Are you an individual or a business?</h1>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Button
          variant="outline"
          className="h-40 flex flex-col items-center justify-center"
          onClick={() => {
            const sp = new URLSearchParams(window.location.search);
            const next = sp.get("next") || "/dashboard";
            router.push(`/login?type=individual&next=${encodeURIComponent(next)}`);
          }}
        >
          <span className="text-xl font-medium">Individual</span>
          <span className="mt-2 text-muted-foreground">Volunteer or donate as an individual</span>
        </Button>
        <Button
          variant="outline"
          className="h-40 flex flex-col items-center justify-center"
          onClick={() => {
            const sp = new URLSearchParams(window.location.search);
            const next = sp.get("next") || "/dashboard/business";
            router.push(`/login?type=business&next=${encodeURIComponent(next)}`);
          }}
        >
          <span className="text-xl font-medium">Business</span>
          <span className="mt-2 text-muted-foreground">Sponsor meals or partner with us</span>
        </Button>
      </div>
    </div>
  );
}
