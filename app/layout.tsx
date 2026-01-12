import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { GlobalLoadingCursor } from "@/components/ui/global-loading-cursor";

import { Providers } from "@/components/providers";
import { safeGetServerSession } from "@/lib/auth";
import { ImpersonationBanner } from "@/components/dashboard/admin/impersonation-banner";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | Optimise Operations",
    default: "Optimise Operations",
  },
  openGraph: {
    images: [
      {
        url: `${siteUrl}/images/og-image.jpg`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: !isProduction ? "noindex, nofollow" : "index, follow",
};

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const fontDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("RootLayout: start");
  const session = await safeGetServerSession();
  // const session = null;
  console.log("RootLayout: session retrieved", !!session);

  const isImpersonating = (session as any)?.isImpersonating;

  return (
    <html lang="en" suppressHydrationWarning>
      <link rel="icon" href="/favicon.ico" />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overscroll-none",
          fontSans.variable,
          fontDisplay.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers session={session}>
          <div className="contents">
            <GlobalLoadingCursor />
            {isImpersonating && <ImpersonationBanner originalUserEmail={(session as any)?.originalUserEmail} />}
            {children}
          </div>
        </Providers>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  );
}
