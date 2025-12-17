import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";
import { revalidatePath } from "next/cache";

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
  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-3xl font-semibold">Sponsor a meal distribution</h1>
      <p className="mt-2 text-muted-foreground">
        Share meals for upcoming distributions. We’ll contact you to coordinate details.
      </p>
      <form action={submitSponsorship} className="mt-6 grid gap-4">
        <input
          name="businessName"
          placeholder="Business name"
          className="rounded-md border px-3 py-2"
          required
        />
        <div>
          <label className="text-sm text-muted-foreground">Business logo (optional)</label>
          <input
            name="businessLogo"
            type="file"
            accept="image/*"
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
        <input
          name="contactEmail"
          type="email"
          placeholder="Contact email"
          className="rounded-md border px-3 py-2"
        />
        <input
          name="mealsCount"
          type="number"
          min={1}
          placeholder="Meals count"
          className="rounded-md border px-3 py-2"
          required
        />
        <input
          name="date"
          type="date"
          className="rounded-md border px-3 py-2"
        />
        <input
          name="location"
          placeholder="Pickup/Delivery location"
          className="rounded-md border px-3 py-2"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          className="rounded-md border px-3 py-2"
          rows={4}
        />
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
          Send Request
        </button>
      </form>
    </div>
  );
}
