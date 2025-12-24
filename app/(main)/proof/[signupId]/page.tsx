import { fetchSanitySignupById } from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";
import { revalidatePath } from "next/cache";
import { getLocale, t } from "@/lib/i18n";

async function submitProof(formData: FormData) {
  const signupId = String(formData.get("signupId") || "");
  const consent = String(formData.get("consent") || "");
  const files = (formData.getAll("proof") as File[]).filter(Boolean);
  if (!signupId || files.length === 0) {
    return;
  }

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || previewToken;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const current = await writeClient.getDocument(signupId);
  if (!current || current._type !== "signup" || current.status !== "confirmed") {
    throw new Error("Not allowed");
  }

  const uploaded: any[] = [];
  for (const f of files) {
    const arrayBuffer = await f.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isImage = (f.type || "").startsWith("image/");
    const type = isImage ? "image" : "file";
    const asset = await writeClient.assets.upload(type as any, buffer, {
      filename: f.name || "proof",
      contentType: f.type || (isImage ? "image/jpeg" : "application/octet-stream"),
    });
    uploaded.push(
      isImage
        ? { _type: "image", asset: { _type: "reference", _ref: asset._id } }
        : { _type: "file", asset: { _type: "reference", _ref: asset._id } }
    );
  }

  await writeClient
    .patch(signupId)
    .set({
      proofMedia: uploaded,
      consent: consent === "on",
      status: "completed",
      completedAt: new Date().toISOString(),
    })
    .commit();

  revalidatePath(`/proof/${signupId}`);
}

export default async function ProofPage(props: { params: Promise<{ signupId: string }> }) {
  const params = await props.params;
  const locale = await getLocale();
  const signup = await fetchSanitySignupById({ id: params.signupId, locale });
  if (!signup) notFound();

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-2xl font-semibold">{t("uploadProof", locale)} {signup.event?.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {new Date(signup.event?.date).toLocaleString()} • {signup.event?.location}
      </p>
      {signup.status !== "confirmed" ? (
        <div className="mt-6 rounded-md border border-[rgba(184,50,92,0.28)] bg-[rgba(255,208,239,0.35)] p-4 text-sm text-muted-foreground">
          {signup.status === "received"
            ? t("proofNotAllowedPending", locale)
            : signup.status === "rejected"
            ? t("proofNotAllowedRejected", locale)
            : t("proofNotAllowedGeneric", locale)}
        </div>
      ) : (
        <form action={submitProof} className="mt-6 grid gap-4">
          <input type="hidden" name="signupId" value={params.signupId} />
          <input
            name="proof"
            type="file"
            accept="image/*,video/*"
            multiple
            className="rounded-md border border-[rgba(184,50,92,0.28)] bg-[rgba(255,247,229,0.65)] px-3 py-2"
            required
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="consent" />
            {t("consentPictures", locale)}
          </label>
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
            {t("submit", locale)}
          </button>
        </form>
      )}
    </div>
  );
}
