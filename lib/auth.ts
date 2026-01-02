import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import bcrypt from "bcryptjs";
import { client } from "@/sanity/lib/client";
import crypto from "crypto";
import fs from "node:fs";
import path from "node:path";

function readDotEnvLocalValue(key: string): string {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf8");
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^\\s*(?:export\\s+)?${escapedKey}\\s*=\\s*(.*)\\s*$`);
    const line = content
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#") && re.test(l));
    if (!line) return "";
    const m = line.match(re);
    const raw = String(m?.[1] || "").trim();
    const unquoted =
      (raw.startsWith("\"") && raw.endsWith("\"")) ||
      (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw;
    return unquoted.trim();
  } catch {
    return "";
  }
}

export function getGoogleOAuthConfig(): { clientId: string; clientSecret: string } {
  const clientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    readDotEnvLocalValue("GOOGLE_CLIENT_ID") ||
    readDotEnvLocalValue("NEXT_PUBLIC_GOOGLE_CLIENT_ID") ||
    "";
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET?.trim() ||
    readDotEnvLocalValue("GOOGLE_CLIENT_SECRET") ||
    readDotEnvLocalValue("NEXT_PUBLIC_GOOGLE_CLIENT_SECRET") ||
    "";
  return { clientId, clientSecret };
}

const devNextAuthSecret =
  process.env.NODE_ENV === "development"
    ? crypto.createHash("sha256").update(process.cwd()).digest("hex")
    : undefined;

export function getAuthOptions(): NextAuthOptions {
  const { clientId: googleClientId, clientSecret: googleClientSecret } = getGoogleOAuthConfig();
  const isDev = process.env.NODE_ENV === "development";
  const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";

  async function recordLogin(params: { accountId: string; provider: string }) {
    if (!writeToken) return;
    const now = new Date().toISOString();
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
    await writeClient
      .patch(params.accountId)
      .set({ lastLoginAt: now })
      .setIfMissing({ loginHistory: [] })
      .append("loginHistory", [{ provider: params.provider, createdAt: now }])
      .commit();
  }

  return {
    secret: nextAuthSecret || devNextAuthSecret,
    cookies: isDev
      ? {
          sessionToken: {
            name: "next-auth.session-token.dev-v2",
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: false,
            },
          },
        }
      : undefined,
    providers: [
      CredentialsProvider({
        name: "Email and Password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = String(credentials?.email || "");
          const password = String(credentials?.password || "");
          if (!email || !password) return null;
          const account = await fetchSanityAccountByEmail({ email });
          if (!account) return null;
          if (account.status === "disabled") return null;
          const hash = account.passwordHash || "";
          const match = hash ? await bcrypt.compare(password, hash) : false;
          if (!match) return null;
          return {
            id: account._id,
            email: account.email,
            name: account.name,
            type: account.type,
            provider: "credentials",
            isAdmin: account.type === "admin",
          } as any;
        },
      }),
      ...(googleClientId && googleClientSecret
        ? [
            GoogleProvider({
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            }),
          ]
        : []),
    ],
    pages: {
      signIn: "/login",
      error: "/login",
    },
    session: { strategy: "jwt" },
    callbacks: {
      async signIn({ account, profile, user }) {
        if (account?.provider === "google") {
          const email = String((user as any)?.email || (profile as any)?.email || "");
          if (!email) return true;

          const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
          const canWrite = Boolean(writeToken);
          const emailLower = email.toLowerCase();
          const name = String((user as any)?.name || "");
          const adminList = (process.env.ADMIN_EMAILS || "")
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

          let acct = await fetchSanityAccountByEmail({ email });

          if (!acct && adminList.includes(emailLower)) {
            if (!canWrite) return "/login?error=missing_token";
            const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
            try {
              acct = await writeClient.create({
                _type: "account",
                email,
                name,
                type: "admin",
                status: "active",
                sessionVersion: 1,
              });
            } catch {
              return "/login?error=permissions";
            }
          }

          if (!acct) {
            return "/login?error=no_account";
          }

          if ((acct as any).status === "disabled") {
            return "/login?error=disabled";
          }
        }
        return true;
      },
      async jwt({ token, account, user }) {
        const provider = String(account?.provider || (token as any).provider || "");
        if (provider) (token as any).provider = provider;

        const email = String((user as any)?.email || (token as any)?.email || "");
        if (email) {
          try {
            const acct = await fetchSanityAccountByEmail({ email });
            if (!acct || String(acct.status || "") === "disabled") {
              (token as any).invalid = true;
              return token;
            }

            const currentSessionVersionRaw = (acct as any).sessionVersion;
            const currentSessionVersion =
              typeof currentSessionVersionRaw === "number" && Number.isFinite(currentSessionVersionRaw)
                ? currentSessionVersionRaw
                : 1;

            const existingSessionVersionRaw = (token as any).sessionVersion;
            const hasExistingSessionVersion =
              typeof existingSessionVersionRaw === "number" && Number.isFinite(existingSessionVersionRaw);
            if (hasExistingSessionVersion && existingSessionVersionRaw !== currentSessionVersion) {
              (token as any).invalid = true;
              return token;
            }

            (token as any).accountId = acct._id;
            (token as any).sessionVersion = currentSessionVersion;
            (token as any).isAdmin = acct.type === "admin" && acct.status !== "disabled";
            (token as any).type = acct.type;

            if (account) {
              await recordLogin({ accountId: String(acct._id), provider: provider || String(account.provider || "") });
            }
          } catch {}
        }
        return token;
      },
      async session({ session, token }) {
        if ((token as any)?.invalid) {
          throw new Error("Session invalidated");
        }
        (session as any).provider = (token as any).provider;
        (session as any).isAdmin = (token as any).isAdmin;
        (session as any).type = (token as any).type;
        (session as any).accountId = (token as any).accountId;
        (session as any).sessionVersion = (token as any).sessionVersion;
        return session;
      },
    },
  };
}

export async function safeGetServerSession() {
  try {
    const { getServerSession } = await import("next-auth");
    return await getServerSession(getAuthOptions());
  } catch {
    return null;
  }
}

export type AccountType = "admin" | "manager" | "employee" | "client";

export type AccountWithCapabilities = {
  _id?: string;
  email?: string;
  type?: AccountType | string;
  status?: string;
  capabilities?: string[] | null;
  revokedCapabilities?: string[] | null;
};

const UNIVERSAL_CAPABILITIES = [
  "identity.session.authenticate.google",
  "identity.session.maintain",
  "identity.session.logout_all",
  "identity.profile.view_own",
  "identity.profile.edit_own",
  "identity.preferences.timezone_locale",
  "identity.preferences.notifications",
  "identity.security.last_login_activity",
  "system.search.global",
  "system.command_palette",
  "system.realtime_updates",
  "system.announcements.view",
  "system.feedback.submit",
  "message.read",
];

const ADMIN_CAPABILITIES = [
  "users.invite",
  "users.remove",
  "users.suspend",
  "users.reinstate",
  "users.roles.change",
  "users.capabilities.assign",
  "users.activity_logs.view",
  "users.impersonate.read_only",
  "users.sessions.reset",
  "clients.manage",
  "client.services.manage",
  "client.services.settings.configure",
  "teams.assign_clients",
  "teams.define_structure",
  "system.settings.configure",
  "system.feature_flags.manage",
  "system.environments.manage",
  "task.view.all",
  "task.create",
  "task.update.all",
  "task.delete.all",
  "task.assign",
  "task.status.override",
  "task.owner.reassign",
  "task.visibility.set",
  "task.templates.manage",
  "task.bulk.manage",
  "calendar.view.all",
  "calendar.create",
  "calendar.update",
  "calendar.delete",
  "calendar.assign",
  "calendar.event_types.define",
  "calendar.conflicts.override",
  "calendar.availability.manage",
  "message.create",
  "message.view.all",
  "message.participate.any",
  "message.moderate",
  "message.pin",
  "message.delete",
  "message.archive",
  "support.ticket.manage",
  "system.announcements.create",
  "client.dashboards.view.all",
  "analytics.view.all",
  "analytics.ingestion.configure",
  "analytics.visibility.override",
  "analytics.export.all",
  "analytics.schemas.define",
  "finance.view.all",
  "finance.revenue.view",
  "finance.invoices.manage",
  "finance.reports.export",
  "finance.billing_rules.set",
  "documents.view.shared",
  "documents.upload",
  "documents.folders.organize",
  "documents.share.team",
  "documents.share.clients",
  "documents.permissions.set",
  "documents.download",
  "cms.sanity.full_access",
  "cms.help_articles.manage",
  "cms.onboarding_content.manage",
  "cms.email_templates.manage",
  "cms.ui_copy.manage",
  "security.audit.view",
  "security.audit.export",
  "security.retention.define",
  "security.api_keys.manage",
  "security.credentials.revoke",
];

const MANAGER_CAPABILITIES = [
  "team.members.view",
  "users.invite.limited",
  "team.members.remove",
  "task.assign.team",
  "task.owner.reassign.team",
  "team.metrics.view",
  "calendar.team.view",
  "calendar.availability.view",
  "calendar.pto.approve",
  "task.create",
  "task.update.team",
  "task.status.change.team",
  "task.comment",
  "task.bulk.team",
  "task.recurring.create",
  "task.reassign.manage",
  "calendar.team.create",
  "calendar.team.update",
  "calendar.team.assign",
  "calendar.campaign.view",
  "calendar.conflicts.resolve",
  "message.create",
  "message.threads.task.participate",
  "message.threads.support.participate",
  "message.pin",
  "system.announcements.team.mark",
  "client.dashboards.view.assigned",
  "analytics.view.client_assigned",
  "client.performance.view",
  "client.services.manage",
  "client.services.settings.configure",
  "client.performance.comment_internal",
  "client.issues.escalate",
  "support.ticket.manage",
  "documents.upload",
  "documents.download",
  "documents.folders.organize",
  "documents.share.team",
  "documents.share.clients",
  "documents.permissions.set",
  "analytics.metrics.view",
  "analytics.compare",
  "analytics.export.scoped",
  "analytics.annotate",
  "analytics.insights.create",
  "identity.profile.manage_own",
  "team.notification_defaults.manage",
];

const EMPLOYEE_CAPABILITIES = [
  "task.view.assigned",
  "task.status.change.own",
  "task.update.description.own",
  "task.comment",
  "task.attachments.upload",
  "task.history.view",
  "task.reassign.request",
  "task.blockers.mark",
  "calendar.view.own",
  "calendar.create.own",
  "calendar.update.own",
  "calendar.campaign.assigned.view",
  "calendar.deadlines.view",
  "message.create",
  "message.threads.task.participate",
  "message.threads.client_assigned.participate",
  "message.react",
  "clients.assigned.view",
  "clients.overview.view",
  "analytics.view.read_only",
  "clients.notes.internal.add",
  "documents.view.shared",
  "documents.upload",
  "documents.download",
  "documents.comment",
  "analytics.view.relevant",
  "analytics.filter",
  "analytics.charts.view",
  "identity.profile.manage_own",
  "identity.preferences.notifications",
  "calendar.availability.own",
];

const CLIENT_CAPABILITIES = [
  "client.dashboard.view",
  "client.performance.view",
  "analytics.view.read_only",
  "analytics.history.view",
  "analytics.filter",
  "analytics.export.scoped",
  "client.services.view",
  "client.services.toggle",
  "client.services.request_new",
  "client.services.status.view",
  "calendar.campaign.view",
  "calendar.content_plan.view",
  "calendar.deadlines.client.view",
  "calendar.date_change.request",
  "support.ticket.create",
  "support.threads.participate",
  "support.ticket.files.upload",
  "support.ticket.status.view",
  "documents.view.shared",
  "documents.download.deliverables",
  "documents.reports.view",
  "identity.profile.manage_own",
  "identity.preferences.notifications",
  "identity.oauth.manage_connected_accounts",
  "billing.manage_own",
];

const KNOWN_CAPABILITIES = new Set<string>([
  ...UNIVERSAL_CAPABILITIES,
  ...ADMIN_CAPABILITIES,
  ...MANAGER_CAPABILITIES,
  ...EMPLOYEE_CAPABILITIES,
  ...CLIENT_CAPABILITIES,
]);

function assertKnownCapability(capability: string) {
  if (process.env.NODE_ENV === "production") return;
  if (!KNOWN_CAPABILITIES.has(capability)) {
    throw new Error(`Unknown capability: ${capability}`);
  }
}

function normalizeCapabilities(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((v) => String(v || "").trim())
      .filter(Boolean);
  }
  return String(input)
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function getRoleDefaultCapabilities(type: string): string[] {
  switch (type) {
    case "admin":
      return ADMIN_CAPABILITIES;
    case "manager":
      return MANAGER_CAPABILITIES;
    case "employee":
      return EMPLOYEE_CAPABILITIES;
    case "client":
      return CLIENT_CAPABILITIES;
    default:
      return [];
  }
}

export function getEffectiveCapabilities(account: AccountWithCapabilities | null | undefined): Set<string> {
  const type = String(account?.type || "");
  const base = new Set<string>([...UNIVERSAL_CAPABILITIES, ...getRoleDefaultCapabilities(type)]);
  const extra = normalizeCapabilities(account?.capabilities);
  const revoked = new Set<string>(normalizeCapabilities(account?.revokedCapabilities));
  if (process.env.NODE_ENV !== "production") {
    for (const c of extra) assertKnownCapability(c);
    for (const c of revoked) assertKnownCapability(c);
  }
  for (const c of extra) base.add(c);
  for (const c of revoked) base.delete(c);
  return base;
}

export function hasAccountCapability(account: AccountWithCapabilities | null | undefined, capability: string): boolean {
  assertKnownCapability(capability);
  if (!account) return false;
  if (String(account.status || "") === "disabled") return false;
  return getEffectiveCapabilities(account).has(capability);
}
