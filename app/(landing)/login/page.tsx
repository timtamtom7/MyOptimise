import GoogleSignInButton from "@/components/auth/google-signin-button";
import CredentialsLoginForm from "@/components/auth/credentials-login-form";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getGoogleOAuthConfig, safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchSanityAccountByEmail, fetchSanitySettings } from "@/sanity/lib/fetch";
import { sanityConfigured } from "@/sanity/env";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Logo from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function LoginPage(props: { searchParams?: Promise<{ next?: string; error?: string }> }) {
  const sp = (await props.searchParams) || {};
  const next = sp.next || "/";
  const emailHint = String((sp as any)?.email || "").trim();
  const error = sp.error;
  const session = await safeGetServerSession();
  
  // Fetch settings for Logo
  const settings = await fetchSanitySettings();

  if (session && !error) {
    const email = (session as any)?.user?.email || "";
    const account = email ? await fetchSanityAccountByEmail({ email }) : null;
    const accountType = String(account?.type || "");
    const dest =
      accountType === "client"
        ? "/dashboard/client"
        : accountType === "admin"
          ? "/dashboard/admin"
          : accountType === "manager"
            ? "/dashboard/manager"
            : accountType === "employee"
              ? "/dashboard/employee"
              : "/";
    redirect(next || dest);
  }
  const locale = await getLocale();
  const { clientId: googleClientId, clientSecret: googleClientSecret } = getGoogleOAuthConfig();
  const googleEnabled = Boolean(googleClientId && googleClientSecret);
  const hasWriteToken = Boolean(process.env.SANITY_API_WRITE_TOKEN);
  const errorMessage =
    error === "missing_token" || (error === "AccessDenied" && !hasWriteToken)
      ? hasWriteToken
        ? "This deployment should have SANITY_API_WRITE_TOKEN, but sign-in reported it missing. You’re likely hitting a different Vercel environment/deployment than you expect."
        : "Setup required: missing Sanity write token. Configure SANITY_API_WRITE_TOKEN to accept account requests."
      : error === "permissions"
        ? "Account write failed. Check Sanity API token permissions and dataset configuration."
      : error === "no_account"
        ? "No account found for this email. Ask a director to create and publish your account."
      : error === "disabled"
        ? "This account is disabled. Ask a director to re-enable it."
      : error === "Configuration"
        ? "Google sign-in isn’t configured for production. In Vercel (Production env), set NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET, then redeploy."
      : error === "OAuthCallback"
          ? "Google sign-in callback failed. Double-check the Google OAuth redirect URI matches this domain exactly."
        : error === "OAuthSignin"
            ? "Google sign-in couldn’t start. Double-check Google OAuth client settings for this domain."
            : error === "AccessDenied"
              ? "Sign-in was denied. If you cancelled the Google prompt, try again."
              : error
                ? `Sign-in failed (${error}).`
                : "";
                
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
           <Logo settings={settings} className="h-12 w-auto mb-4" />
        </div>

        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t("signInTitle", locale)}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("heroSubLoggedOut", locale)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!sanityConfigured && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
                Setup required: missing Sanity project configuration. Set NEXT_PUBLIC_SANITY_PROJECT_ID (and optionally NEXT_PUBLIC_SANITY_DATASET).
              </div>
            )}
            {errorMessage && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            
            <div className="space-y-4">
              {googleEnabled ? (
                <GoogleSignInButton
                  callbackUrl={next || "/"}
                  label={t("continueWithGoogle", locale)}
                  loginHint={emailHint || undefined}
                />
              ) : (
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Google sign-in is disabled until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set for this deployment.
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground">
                  Sign in with your email and password.
                </p>
                <CredentialsLoginForm callbackUrl={next} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}