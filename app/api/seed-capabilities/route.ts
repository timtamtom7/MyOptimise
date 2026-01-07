import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';

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
];

export async function GET() {
  const allCapabilities = new Set([
    ...UNIVERSAL_CAPABILITIES,
    ...ADMIN_CAPABILITIES,
    ...MANAGER_CAPABILITIES,
    ...EMPLOYEE_CAPABILITIES,
    ...CLIENT_CAPABILITIES
  ]);

  // 1. Insert Capabilities
  const caps = Array.from(allCapabilities).map(name => {
    const parts = name.split('.');
    const category = parts[0];
    return { name, category };
  });
  
  const { error: capError } = await (supabaseAdmin as any)
    .from('capabilities')
    .upsert(caps, { onConflict: 'name', ignoreDuplicates: true });

  if (capError) return NextResponse.json({ error: capError }, { status: 500 });

  // 2. Fetch all capabilities to get IDs
  const { data: dbCaps } = await (supabaseAdmin as any).from('capabilities').select('id, name');
  if (!dbCaps) return NextResponse.json({ error: "Failed to fetch caps" }, { status: 500 });
  
  const capMap = new Map(dbCaps.map((c: any) => [c.name, c.id]));

  // 3. Insert Role Capabilities
  const roleCapsMap = new Map<string, { role: string, capability_id: string }>();
  
  // Helper to add role caps
  const addRoleCaps = (role: string, capNames: string[]) => {
    capNames.forEach(name => {
      const id = capMap.get(name) as string;
      if (id) {
        const key = `${role}:${id}`;
        roleCapsMap.set(key, { role, capability_id: id });
      }
    });
  };

  addRoleCaps('admin', ADMIN_CAPABILITIES);
  addRoleCaps('manager', MANAGER_CAPABILITIES);
  addRoleCaps('employee', EMPLOYEE_CAPABILITIES);
  addRoleCaps('client', CLIENT_CAPABILITIES);
  
  // Add Universal to all
  addRoleCaps('admin', UNIVERSAL_CAPABILITIES);
  addRoleCaps('manager', UNIVERSAL_CAPABILITIES);
  addRoleCaps('employee', UNIVERSAL_CAPABILITIES);
  addRoleCaps('client', UNIVERSAL_CAPABILITIES);

  const roleCaps = Array.from(roleCapsMap.values());

  const { error: roleError } = await (supabaseAdmin as any)
    .from('role_capabilities')
    .upsert(roleCaps, { onConflict: 'role, capability_id', ignoreDuplicates: true });

  if (roleError) return NextResponse.json({ error: roleError }, { status: 500 });

  return NextResponse.json({ success: true, count: roleCaps.length });
}
