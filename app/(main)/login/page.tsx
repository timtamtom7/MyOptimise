import GoogleSignInButton from "@/components/auth/google-signin-button";
import CredentialsLoginForm from "@/components/auth/credentials-login-form";
import Link from "next/link";
import { t, getLocale } from "@/lib/i18n";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

export const dynamic = "force-dynamic";

export default async function LoginPage(props: { searchParams?: Promise<{ type?: string; next?: string; pending?: string; error?: string }> }) {
  const sp = (await props.searchParams) || {};
  const type = sp.type || "individual";
  const next = sp.next || "/";
  const pending = sp.pending;
  const error = sp.error;
  const session = await getServerSession(authOptions);
  if (session) {
    const email = (session as any)?.user?.email || "";
    const account = email ? await fetchSanityAccountByEmail({ email }) : null;
    if (next) {
      redirect(next);
    } else {
      redirect(account?.type === "business" ? "/dashboard/business" : "/dashboard");
    }
  }
  const locale = await getLocale();
  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      {pending && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-40" />
          <div className="fixed z-50 left-1/2 top-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
            <div className="text-xl font-semibold">{t("requestSubmitted", locale)}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {t("pendingModalBody", locale)}
            </div>
            <div className="mt-6 flex gap-3">
              <Link href="/" className="rounded-md bg-primary px-4 py-2 text-primary-foreground flex-1 text-center">{t("goHome", locale)}</Link>
              <Link href="/events" className="rounded-md border px-4 py-2 flex-1 text-center">{t("browseEvents", locale)}</Link>
            </div>
          </div>
        </>
      )}
      <h1 className="text-3xl font-semibold">{t("signInTitle", locale)}</h1>
      <p className="mt-2 text-muted-foreground">
        {type === "business"
          ? t("signInBusinessDesc", locale)
          : t("signInIndividualDesc", locale)}
      </p>
      {error && (
        <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {error === "missing_token"
            ? "Setup required: missing Sanity write token. Sign in with Google or configure SANITY_API_WRITE_TOKEN."
            : "Sign in failed due to server permissions. Try Google or contact support."}
        </div>
      )}
      {pending && (
        <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          {t("pendingModalBody", locale)}
        </div>
      )}
      <div className="mt-4">
        <GoogleSignInButton
          callbackUrl={next || "/"}
          label={t("continueWithGoogle", locale)}
        />
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-medium">Or use email and password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Available for approved accounts. If you don’t have an account,{" "}
          <Link href={`/signup?type=${type}`} className="underline">sign up</Link>.
        </p>
        <div className="mt-4">
          <CredentialsLoginForm callbackUrl={next} />
        </div>
      </div>
    </div>
  );
}
