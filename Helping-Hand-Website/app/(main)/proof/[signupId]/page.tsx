import { fetchSanitySignupById } from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";
import { revalidatePath } from "next/cache";

async function submitProof(formData: FormData) {
  const signupId = String(formData.get("signupId") || "");
  const consent = String(formData.get("consent") || "");
  const file = formData.get("proof") as File | null;

  if (!signupId || !file) {
    return;
  }

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const asset = await writeClient.assets.upload("image", buffer, {
    filename: file.name || "proof.jpg",
    contentType: file.type || "image/jpeg",
  });

  await writeClient
    .patch(signupId)
    .set({
      proofImage: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
      consent: consent === "on",
      status: "completed",
      completedAt: new Date().toISOString(),
    })
    .commit();

  revalidatePath(`/proof/${signupId}`);
}

export default async function ProofPage(props: { params: Promise<{ signupId: string }> }) {
  const params = await props.params;
  const signup = await fetchSanitySignupById({ id: params.signupId });
  if (!signup) notFound();

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-2xl font-semibold">Upload proof for {signup.event?.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {new Date(signup.event?.date).toLocaleString()} • {signup.event?.location}
      </p>
      <form action={submitProof} className="mt-6 grid gap-4">
        <input type="hidden" name="signupId" value={params.signupId} />
        <input
          name="proof"
          type="file"
          accept="image/*"
          className="rounded-md border px-3 py-2"
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="consent" />
          Consent to pictures for verification and impact reporting
        </label>
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
          Submit
        </button>
      </form>
    </div>
  );
}
