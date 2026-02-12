import GoogleSignInButton from "@/components/auth/google-signin-button";
import CredentialsLoginForm from "@/components/auth/credentials-login-form";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getGoogleOAuthConfig, safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { fetchSanityAccountByEmail, fetchSanitySettings } from "@/sanity/lib/fetch";
import { sanityConfigured } from "@/sanity/env";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { devSkipAuth } from "./actions";

// Mock data for the visual chart
const chartData = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 550 },
  { name: 'Thu', value: 450 },
  { name: 'Fri', value: 650 },
  { name: 'Sat', value: 500 },
  { name: 'Sun', value: 700 },
];

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
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* Left Side - Clean Modern Form */}
      <div className="relative flex flex-col justify-center items-center px-8 py-12 lg:px-12 xl:px-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-black min-h-[calc(100vh)]">
        
        <div className="mx-auto w-full max-w-[360px] flex flex-col gap-8">
          <div className="flex flex-col gap-2 items-center mb-8">
             <Logo settings={settings} className="h-9 w-auto" />
          </div>

          {!sanityConfigured && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-400">
              Setup required: missing Sanity project configuration. Set NEXT_PUBLIC_SANITY_PROJECT_ID.
            </div>
          )}
          {errorMessage && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-6">
            {googleEnabled ? (
               <GoogleSignInButton
                 callbackUrl={next || "/"}
                 label={t("continueWithGoogle", locale)}
                 loginHint={emailHint || undefined}
               />
            ) : (
               <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                 Google sign-in is disabled. Configure credentials to enable.
               </div>
            )}
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-50 dark:bg-black px-4 text-slate-400 font-bold tracking-wider">
                  Or
                </span>
              </div>
            </div>

            <CredentialsLoginForm callbackUrl={next} />
          </div>
          
        </div>
        
          {/* Footer Links - Bottom */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
           <div className="flex justify-center gap-6">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
           </div>
        </div>
      </div>

      {/* Right Side - Visual Hero */}
      <div className="hidden lg:flex relative overflow-hidden bg-slate-950 flex-col justify-center items-center p-12">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        
        {/* Abstract Glowing Orbs */}
        <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-blue-500/30 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[4000ms]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen" />

        {/* Floating UI Elements (Mock Dashboard) */}
        <div className="relative z-10 w-full max-w-lg perspective-1000">
          
          {/* Card 1: Main Chart */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl mb-6 transform rotate-y-12 hover:rotate-0 transition-transform duration-500">
             <div className="flex items-center justify-between mb-4">
                <div>
                   <h3 className="text-white font-medium text-lg">Performance</h3>
                   <p className="text-slate-400 text-sm">Weekly Analytics</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                   <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
             </div>
             <div className="h-[180px] w-full">
               {/* Client-side only chart rendering would be ideal, but for SSR we can just use simple SVG or a static placeholder if Recharts issues arise. 
                   Using a simple CSS graph for stability in this demo. */}
                <div className="flex items-end justify-between h-full gap-2 px-2 pb-2">
                   {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="w-full bg-blue-500/40 rounded-t-sm hover:bg-blue-500/60 transition-colors" style={{ height: `${h}%` }}></div>
                   ))}
                </div>
             </div>
          </div>

          {/* Card 2: Floating Stats */}
          <div className="absolute -right-12 top-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-xl w-48 animate-bounce duration-[3000ms]">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600/30 flex items-center justify-center text-white">
                   <Users className="h-5 w-5" />
                </div>
                <div>
                   <div className="text-2xl font-bold text-white">12.5k</div>
                   <div className="text-xs text-slate-300">Active Users</div>
                </div>
             </div>
          </div>

           {/* Card 3: Success Notification */}
           <div className="absolute -left-8 bottom-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-xl flex items-center gap-3 animate-pulse">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div>
                 <div className="text-sm font-medium text-white">Optimization Complete</div>
                 <div className="text-xs text-slate-400">Just now</div>
              </div>
           </div>

        </div>

        {/* Testimonial */}
        <div className="absolute bottom-12 left-12 right-12 text-center lg:text-left z-10">
           <blockquote className="space-y-2 max-w-lg">
             <p className="text-xl text-slate-200 font-light leading-relaxed">
               "The insights we've gained have fundamentally changed our decision-making process. It's not just data; it's clarity."
             </p>
             <footer className="flex items-center gap-3 pt-2">
               <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500" />
               <div className="text-sm">
                 <div className="text-white font-medium">Alex Morgan</div>
                 <div className="text-slate-400">CTO at TechFlow</div>
               </div>
             </footer>
           </blockquote>
        </div>
      </div>
    </div>
  );
}