import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import GoogleSignInButton from "@/components/auth/google-signin-button";
import { token as previewToken } from "@/sanity/lib/token";

async function createAccount(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const type = String(formData.get("type") || "individual");
  const notes = String(formData.get("notes") || "");
  const password = String(formData.get("password") || "");
  if (!email) return;
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  try {
    if (!writeToken) {
      redirect(`/login?type=${type}&error=missing_token&pending=1`);
    }
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    const account = await writeClient.create({
      _type: "account",
      name,
      email,
      type,
      status: "pending",
      notes,
      passwordHash,
    });
    const resendKey = process.env.RESEND_API_KEY || "";
    if (resendKey) {
      const resend = new Resend(resendKey);
      try {
        await resend.emails.send({
          from: "Helping Hand <notifications@helpinghand.local>",
          to: email,
          subject: "Your account is pending approval",
          html: `<p>Thanks for signing up. Your account is pending approval. You'll be notified once approved.</p>`,
        });
        const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (adminEmails.length) {
          await resend.emails.send({
            from: "Helping Hand <notifications@helpinghand.local>",
            to: adminEmails,
            subject: "New account pending approval",
            html: `<p>${name || email} requested a ${type} account.</p><p>Sanity ID: ${account._id}</p>`,
          });
        }
      } catch {}
    }
  } catch {
    redirect(`/login?type=${type}&error=permissions&pending=1`);
  }
  revalidatePath("/signup");
  redirect(`/login?type=${type}&pending=1`);
}

export default function SignupPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-3xl font-semibold">Create Account</h1>
      <p className="mt-2 text-muted-foreground">Submit your details. An admin will review and approve.</p>
      <div className="mt-4">
        <GoogleSignInButton callbackUrl="/login?pending=1" label="Sign up with Google" />
      </div>
      <form action={createAccount} className="mt-6 grid gap-4">
        <input name="name" placeholder="Full name or Business name" className="rounded-md border px-3 py-2" />
        <input name="email" type="email" placeholder="Email" required className="rounded-md border px-3 py-2" />
        <input name="password" type="password" placeholder="Password" required className="rounded-md border px-3 py-2" />
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="radio" name="type" value="individual" defaultChecked /> Individual</label>
          <label className="flex items-center gap-2"><input type="radio" name="type" value="business" /> Business</label>
        </div>
        <textarea name="notes" placeholder="Notes (optional)" className="rounded-md border px-3 py-2" rows={3} />
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Submit</button>
      </form>
    </div>
  );
}
