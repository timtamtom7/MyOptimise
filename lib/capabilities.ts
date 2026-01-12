export interface UserCapabilities {
  // Content & Approvals
  'content.view_drafts': boolean;
  'content.create': boolean;
  'content.delete': boolean;
  'content.approve_internal': boolean;
  'content.approve_client': boolean;

  // Communication
  'chat.internal_access': boolean;
  'chat.client_access': boolean;
  'chat.ghost_mode': boolean;
  'chat.requires_approval': boolean;

  // Sales & Growth
  'sales.access': boolean;
  'sales.lead_gen': boolean;
  'sales.contracts': boolean;

  // Admin & Financials
  'analytics.view_financials': boolean;
  'admin.impersonate': boolean;
  'admin.billing': boolean;

  // Legacy / Sidebar Compatibility
  'tasks.read': boolean;
  'task.create': boolean;
  'task.update.all': boolean;
  'task.delete.all': boolean;
  'task.view.all': boolean;
  'calendar.read': boolean;
  'message.read': boolean;
  'documents.view.shared': boolean;
  'finance.view.all': boolean;
  'analytics.view.all': boolean;
  'security.audit.view': boolean;
  'task.status.override': boolean;
  'task.assign': boolean;
  'task.assign.team': boolean;
  'task.visibility.set': boolean;
  'task.templates.manage': boolean;
  'client.services.manage': boolean;
  'users.invite.limited': boolean;
  'users.impersonate.read_only': boolean;
  'system.feature_flags.manage': boolean;
  
  // Missing Admin Capabilities
  'users.invite': boolean;
  'users.remove': boolean;
  'users.capabilities.assign': boolean;
  'users.activity_logs.view': boolean;
  'users.sessions.reset': boolean;
  'support.ticket.manage': boolean;
  'task.reassign.manage': boolean;
  'task.comment': boolean;
  'message.create': boolean;
}

export const ROLE_CAPABILITIES: Record<string, Partial<UserCapabilities>> = {
  admin: {
    'content.view_drafts': true,
    'content.create': true,
    'content.delete': true,
    'content.approve_internal': true,
    'content.approve_client': true,
    'chat.internal_access': true,
    'chat.client_access': true,
    'chat.ghost_mode': true,
    'sales.access': true,
    'sales.lead_gen': true,
    'sales.contracts': true,
    'analytics.view_financials': true,
    'admin.impersonate': true,
    'admin.billing': true,
    // Legacy
    'tasks.read': true,
    'task.create': true,
    'task.update.all': true,
    'task.delete.all': true,
    'task.view.all': true,
    'task.assign': true,
    'task.assign.team': true,
    'task.visibility.set': true,
    'task.templates.manage': true,
    'client.services.manage': true,
    'users.invite.limited': true,
    'users.impersonate.read_only': true,
    'system.feature_flags.manage': true,
    'calendar.read': true,
    'message.read': true,
    'documents.view.shared': true,
    'finance.view.all': true,
    'analytics.view.all': true,
    'security.audit.view': true,
    'task.status.override': true,
    // Missing Admin Capabilities
    'users.invite': true,
    'users.remove': true,
    'users.capabilities.assign': true,
    'users.activity_logs.view': true,
    'users.sessions.reset': true,
    'support.ticket.manage': true,
    'task.reassign.manage': true,
    'task.comment': true,
    'message.create': true,
  },
  manager: {
    'content.view_drafts': true,
    'content.create': true,
    'content.delete': true,
    'content.approve_internal': true,
    'content.approve_client': false, 
    'chat.internal_access': true,
    'chat.client_access': true,
    'sales.access': true,
    'sales.lead_gen': true,
    'analytics.view_financials': true,
    // Legacy
    'tasks.read': true,
    'task.create': true,
    'task.view.all': true,
    'task.update.all': true,
    'task.assign.team': true,
    'task.visibility.set': true,
    'calendar.read': true,
    'message.read': true,
    'documents.view.shared': true,
    'finance.view.all': true,
    'analytics.view.all': true,
    'task.assign': true,
    'task.status.override': true,
  },
  employee: {
    'content.view_drafts': true,
    'content.create': true,
    'chat.internal_access': true,
    'chat.client_access': true,
    'chat.requires_approval': true,
    // Legacy
    'tasks.read': true,
    'calendar.read': true,
    'message.read': true,
    'documents.view.shared': true,
  },
  client: {
    'content.view_drafts': false, 
    'content.approve_client': true,
    'chat.client_access': true,
    // Legacy
    'message.read': true,
  },
  sales: {
    'sales.access': true,
    'sales.lead_gen': true,
    'sales.contracts': true,
    'chat.internal_access': true,
    'content.view_drafts': false,
    // Legacy
    'tasks.read': true,
    'calendar.read': true,
    'message.read': true,
  }
};

export function resolveCapabilities(
  role: string, 
  extra: string[] = [], 
  revoked: string[] = []
): UserCapabilities {
  const normalizedRole = role.toLowerCase();
  const base = ROLE_CAPABILITIES[normalizedRole] || {};
  const caps: any = { ...base };

  if (Array.isArray(extra)) {
    extra.forEach(c => caps[c] = true);
  }

  if (Array.isArray(revoked)) {
    revoked.forEach(c => caps[c] = false);
  }

  return caps as UserCapabilities;
}

export function hasCapability(caps: UserCapabilities | undefined, key: keyof UserCapabilities): boolean {
  return !!caps?.[key];
}

export function hasAccountCapability(account: any, capability: string): boolean {
  const caps = resolveCapabilities(
    account?.type || "employee",
    account?.capabilities || [],
    account?.revokedCapabilities || []
  );
  return !!caps[capability as keyof UserCapabilities];
}

export function getEffectiveCapabilities(account: any): string[] {
  const caps = resolveCapabilities(
    account?.type || "employee",
    account?.capabilities || [],
    account?.revokedCapabilities || []
  );
  
  return Object.entries(caps)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);
}
