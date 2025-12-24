import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";

async function submitSponsorship(formData: FormData) {
  "use server";
  const businessName = String(formData.get("businessName") || "");
  const contactEmail = String(formData.get("contactEmail") || "");
  const mealsCount = Number(formData.get("mealsCount") || 0);
  const date = String(formData.get("date") || "");
  const location = String(formData.get("location") || "");
  const notes = String(formData.get("notes") || "");
  const logoFile = formData.get("businessLogo") as File | null;

  if (!businessName || mealsCount <= 0) {
    return;
  }

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  let businessLogoImage: any = undefined;
  if (logoFile && logoFile.size > 0) {
    const asset = await writeClient.assets.upload("image", logoFile, {
      filename: logoFile.name || "business-logo",
    });
    businessLogoImage = {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
    };
  }

  await writeClient.create({
    _type: "sponsorship",
    businessName,
    contactEmail,
    mealsCount,
    date: date ? new Date(date).toISOString() : undefined,
    location,
    notes,
    businessLogo: businessLogoImage,
    status: "submitted",
  });
  revalidatePath("/sponsor");
}

export default async function SponsorPage() {
  const inputClassName =
    "w-full rounded-md border border-[rgba(70,140,205,0.45)] bg-[rgba(255,247,229,0.65)] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(70,140,205,0.35)]";
  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(900px_circle_at_top_right,rgba(59,130,246,0.18),transparent_55%)]">
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <div className="rounded-3xl bg-[rgba(207,232,255,0.70)] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <h1 className="text-3xl font-semibold">Sponsor a meal distribution</h1>
          <p className="mt-2 text-muted-foreground">
            Share meals for upcoming distributions. We’ll contact you to coordinate details.
          </p>
          <form action={submitSponsorship} className="mt-6 grid gap-4">
        <input
          name="businessName"
          placeholder="Business name"
          className={inputClassName}
          required
        />
        <div>
          <label className="text-sm text-muted-foreground">Business logo (optional)</label>
          <input
            name="businessLogo"
            type="file"
            accept="image/*"
            className={`mt-1 block ${inputClassName}`}
          />
        </div>
        <input
          name="contactEmail"
          type="email"
          placeholder="Contact email"
          className={inputClassName}
        />
        <input
          name="mealsCount"
          type="number"
          min={1}
          placeholder="Meals count"
          className={inputClassName}
          required
        />
        <input
          name="date"
          type="date"
          className={inputClassName}
        />
        <input
          name="location"
          placeholder="Pickup/Delivery location"
          className={inputClassName}
        />
        <textarea
          name="notes"
          placeholder="Notes"
          className={inputClassName}
          rows={4}
        />
        <Button type="submit" variant="blue-pill" className="w-full h-11 rounded-[33px] text-base font-semibold">
          Send Request
        </Button>
      </form>
        </div>
      </div>
    </div>
  );
}
