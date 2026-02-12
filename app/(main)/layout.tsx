import Header from "@/components/header";
import Footer from "@/components/footer";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import { draftMode } from "next/headers";
import { SanityLive } from "@/sanity/lib/live";

import CommandPalette, { type CommandPaletteCommand } from "@/components/command-palette";
import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDraftMode = (await draftMode()).isEnabled;
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const canUseCommandPalette = Boolean(acct && hasAccountCapability(acct, "system.command_palette"));
  const commands: CommandPaletteCommand[] = [];
  if (acct && canUseCommandPalette) {
    const type = String(acct.type || (session as any)?.type || "");
    commands.push({ id: "go_dashboard", label: "Go to Dashboard", kind: "link", href: "/dashboard", keywords: "home" });
    commands.push({ id: "go_settings", label: "Go to Settings", kind: "link", href: "/dashboard/settings", keywords: "profile preferences" });
    if (hasAccountCapability(acct, "system.search.global")) {
      commands.push({ id: "go_search", label: "Go to Search", kind: "link", href: "/dashboard/search", keywords: "find" });
    }
    if (hasAccountCapability(acct, "system.announcements.view")) {
      commands.push({
        id: "go_announcements",
        label: "Go to Announcements",
        kind: "link",
        href: "/dashboard/announcements",
        keywords: "news updates",
      });
    }
    if (hasAccountCapability(acct, "system.feedback.submit")) {
      commands.push({ id: "go_feedback", label: "Go to Feedback", kind: "link", href: "/dashboard/feedback", keywords: "report" });
    }
    if (hasAccountCapability(acct, "documents.view.shared")) {
      commands.push({ id: "go_documents", label: "Go to Documents", kind: "link", href: "/dashboard/documents", keywords: "files" });
    }
    if (
      hasAccountCapability(acct, "analytics.view.all") ||
      hasAccountCapability(acct, "analytics.view.client_assigned") ||
      hasAccountCapability(acct, "analytics.view.read_only")
    ) {
      commands.push({ id: "go_analytics", label: "Go to Analytics", kind: "link", href: "/dashboard/analytics", keywords: "metrics stats" });
    }
    if (hasAccountCapability(acct, "finance.view.all")) {
      commands.push({ id: "go_finance", label: "Go to Finance", kind: "link", href: "/dashboard/finance", keywords: "revenue money" });
    }
    if (hasAccountCapability(acct, "billing.manage_own")) {
      commands.push({ id: "go_billing", label: "Go to Billing", kind: "link", href: "/dashboard/billing", keywords: "invoices payment" });
    }
    if (hasAccountCapability(acct, "security.audit.view")) {
      commands.push({ id: "go_audit_logs", label: "Go to Audit Logs", kind: "link", href: "/dashboard/admin/audit", keywords: "security logs history" });
    }
    if (type === "admin") commands.push({ id: "go_admin", label: "Go to Admin Dashboard", kind: "link", href: "/dashboard/admin", keywords: "users" });
    if (type === "manager") commands.push({ id: "go_manager", label: "Go to Manager Dashboard", kind: "link", href: "/dashboard/manager", keywords: "team" });
    if (type === "employee") commands.push({ id: "go_employee", label: "Go to Employee Dashboard", kind: "link", href: "/dashboard/employee", keywords: "tasks" });
    if (type === "client") commands.push({ id: "go_client", label: "Go to Client Dashboard", kind: "link", href: "/dashboard/client", keywords: "support" });
    if (hasAccountCapability(acct, "identity.session.logout_all")) {
      commands.push({ id: "logout_all", label: "Log out all devices", kind: "logout_all", keywords: "session security" });
    }
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <CommandPalette enabled={canUseCommandPalette} commands={commands} />
      <SanityLive />
      {isDraftMode && <DisableDraftMode />}
      <Footer />
    </div>
  );
}
