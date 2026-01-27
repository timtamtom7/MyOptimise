import React from "react";
import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

const fontDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

import { FlowSettingsNav } from "@/components/flow/flow-settings-nav";
import { safeGetServerSession } from "@/lib/auth";

export default async function FlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await safeGetServerSession();
  const user = {
    name: session?.user?.name,
    email: session?.user?.email,
    image: session?.user?.image,
  };

  return (
    <div className={cn(
      "min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased relative",
      fontDisplay.variable
    )}>
      <FlowSettingsNav user={user} />
      {children}
    </div>
  );
}
