import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { safeGetServerSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { fetchSanitySettings } from "@/sanity/lib/fetch";
import { ArrowRight, ChevronRight, LayoutGrid, ShieldCheck, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import Logo from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const session = await safeGetServerSession();
  const locale = await getLocale();
  const role = String((session as any)?.type || "");
  const settings = await fetchSanitySettings();

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
        
        {/* Section: Hero */}
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-32 overflow-hidden bg-background flex flex-col justify-center min-h-[85vh]">
          <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left Column: Text Content */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-2xl mx-auto lg:mx-0">
                {/* Mobile-first: Welcome + CTA at top */}
                <div className="flex flex-col items-center lg:items-start gap-4 w-full lg:hidden">
                  <div className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
                    <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground/80">Welcome to</span>
                    <Logo settings={settings} className="h-8 w-auto" />
                  </div>

                  <Link
                    href="/login"
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-5 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 text-left w-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                          <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                            Login
                          </p>
                          <p className="text-base font-semibold tracking-tight group-hover:text-primary transition-colors duration-300">
                            {t("cta_login", locale)}
                          </p>
                        </div>
                      </div>
                      <div className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs md:text-sm font-medium text-muted-foreground backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                  {t("systemHealth", locale)}: Operational
                </div>
                
                <h1 className="font-display text-[1.9rem] leading-tight md:text-4xl lg:text-6xl font-medium tracking-tight text-primary pb-2">
                  {t("hero_headline", locale)}
                </h1>

                <p className="text-base md:text-2xl text-muted-foreground leading-relaxed font-light">
                  {t("hero_subheading", locale)}
                </p>

                <div className="flex items-center gap-8 text-muted-foreground opacity-60 grayscale hover:grayscale-0 transition-all duration-500 pt-4 hidden lg:flex">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-medium">SOC2 Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="text-sm font-medium">99.9% Uptime</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex flex-col items-center lg:items-stretch space-y-6 w-full max-w-md mx-auto lg:ml-auto">
                
                {/* Desktop: Welcome + Logo Header */}
                <div className="hidden lg:flex items-center gap-2 text-2xl font-medium text-muted-foreground self-start">
                   <span>Welcome to</span>
                   <Logo settings={settings} className="h-12 w-auto" />
                </div>

                {/* Desktop: Unified Enter Panel */}
                <Link
                  href="/login"
                  className="hidden lg:block group relative overflow-hidden rounded-3xl border border-border bg-card p-8 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                    <div className="flex justify-between items-start">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                        <LayoutGrid className="h-6 w-6" />
                      </div>
                      <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-3xl font-bold mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                        {t("cta_login", locale)}
                      </h3>
                    </div>
                  </div>
                </Link>

                {/* Secondary Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Link
                    href="https://optimiseoperations.com"
                    target="_blank"
                    className={buttonVariants({ 
                      variant: "ghost",
                      size: "lg", 
                      className: "h-12 text-sm font-medium rounded-xl hover:bg-muted transition-all hover:scale-[1.02] active:scale-[0.98] text-muted-foreground hover:text-foreground justify-start px-4" 
                    })}
                  >
                    {t("hero_link_hire", locale)} <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                  </Link>
                  <Link
                    href="https://optimiseoperations.com/careers"
                    target="_blank"
                    className={buttonVariants({ 
                      variant: "ghost",
                      size: "lg", 
                      className: "h-12 text-sm font-medium rounded-xl hover:bg-muted transition-all hover:scale-[1.02] active:scale-[0.98] text-muted-foreground hover:text-foreground justify-start px-4" 
                    })}
                  >
                    {t("hero_link_work", locale)} <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                  </Link>
                </div>

                {/* Mobile Stats (Visible only on mobile) */}
                <div className="flex items-center justify-center gap-8 text-muted-foreground opacity-60 grayscale hover:grayscale-0 transition-all duration-500 pt-8 lg:hidden">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-medium">SOC2 Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="text-sm font-medium">99.9% Uptime</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Footer Stats */}
        <footer className="py-8 border-t border-border/50 bg-muted/20 text-center mt-auto">
           <div className="container px-4 mx-auto">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest opacity-60">
                &copy; {new Date().getFullYear()} Optimise Operations &bull; {t("systemHealth", locale)}: Operational
              </p>
           </div>
        </footer>

      </div>
    );
  }

  const dest =
    role === "client"
      ? "/dashboard/client"
      : role === "admin"
        ? "/dashboard/admin"
        : role === "manager"
          ? "/dashboard/manager"
          : role === "employee"
            ? "/dashboard/employee"
            : "/dashboard";
  
  redirect(dest);
}
