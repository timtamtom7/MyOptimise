export type AccountType = "admin" | "manager" | "employee" | "client";

export type AccountWithCapabilities = {
  _id?: string;
  email?: string;
  type?: AccountType | string;
  status?: string;
  capabilities?: string[] | null;
  revokedCapabilities?: string[] | null;
};

export const UNIVERSAL_CAPABILITIES = [
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

export const ADMIN_CAPABILITIES = [
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
  "finance.create",
  "finance.update",
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

export const MANAGER_CAPABILITIES = [
  "team.members.view",
  "users.invite.limited",
  "team.members.remove",
  "task.assign.team",
  "task.owner.reassign.team",
  "team.metrics.view",
  "calendar.team.view",
  "calendar.availability.view",
  "calendar.pto.approve",
  "calendar.read",
  "task.create",
  "task.update.team",
  "task.status.change.team",
  "task.comment",
  "task.bulk.team",
  "task.recurring.create",
  "task.reassign.manage",
  "tasks.read",
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

export const EMPLOYEE_CAPABILITIES = [
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

export const CLIENT_CAPABILITIES = [
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
  const type = String(account?.type || "").toLowerCase();
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
