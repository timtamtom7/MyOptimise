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
    <div className="min-h-screen bg-background font-sans antialiased relative transition-colors duration-500">
      <FlowSettingsNav user={user} />
      <main className="animate-in fade-in duration-700 ease-out">
        {children}
      </main>
    </div>
  );
}
