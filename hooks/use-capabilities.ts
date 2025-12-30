import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

export interface UserCapabilities {
  canCreateTasks: boolean
  canUpdateTasks: boolean
  canDeleteTasks: boolean
  canViewAllTasks: boolean
  canCreateEvents: boolean
  canUpdateEvents: boolean
  canDeleteEvents: boolean
  canViewAllEvents: boolean
  canSendMessages: boolean
  canViewAllMessages: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  canManageServices: boolean
  canViewReports: boolean
  isOwner: boolean
  isManager: boolean
  isEmployee: boolean
  isClient: boolean
}

const DEFAULT_CAPABILITIES: UserCapabilities = {
  canCreateTasks: false,
  canUpdateTasks: false,
  canDeleteTasks: false,
  canViewAllTasks: false,
  canCreateEvents: false,
  canUpdateEvents: false,
  canDeleteEvents: false,
  canViewAllEvents: false,
  canSendMessages: false,
  canViewAllMessages: false,
  canManageUsers: false,
  canViewAnalytics: false,
  canManageServices: false,
  canViewReports: false,
  isOwner: false,
  isManager: false,
  isEmployee: false,
  isClient: false,
}

type CapabilitiesApiResponse =
  | {
      ok: true;
      account: { id: string; email: string; name?: string; type?: string };
      capabilities: string[];
    }
  | { ok: false; error: string };

type CapabilityAccount = { id: string; email: string; name?: string; type?: string };

export function useCapabilities() {
  const { status } = useSession();
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [account, setAccount] = useState<CapabilityAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const capabilitySet = useMemo(() => new Set(capabilities), [capabilities]);
  const accountType = String(account?.type || "");

  const hasCapability = useCallback(
    (capability: string) => {
      const normalized = String(capability || "").trim();
      if (!normalized) return false;
      if (capabilitySet.has(normalized)) return true;

      const aliasChecks: Record<string, string[]> = {
        "analytics.read": [
          "analytics.view.all",
          "analytics.view.client_assigned",
          "analytics.view.relevant",
          "analytics.view.read_only",
        ],
        "tasks.read": ["task.view.all", "task.view.assigned"],
        "tasks.create": ["task.create"],
        "tasks.update": [
          "task.update.all",
          "task.update.team",
          "task.update.description.own",
          "task.status.change.own",
          "task.status.change.team",
        ],
        "calendar.read": [
          "calendar.view.all",
          "calendar.team.view",
          "calendar.view.own",
          "calendar.campaign.view",
          "calendar.campaign.assigned.view",
          "calendar.content_plan.view",
          "calendar.deadlines.view",
          "calendar.deadlines.client.view",
        ],
        "calendar.create": ["calendar.create", "calendar.team.create", "calendar.create.own"],
        "calendar.update": ["calendar.update", "calendar.team.update", "calendar.update.own"],
        "messages.read": ["message.read", "message.view.all"],
        "messages.create": ["message.create"],
        "services.read": ["client.services.view", "client.services.manage"],
        "services.manage": ["client.services.manage"],
        "services.toggle": ["client.services.toggle"],
        "services.request": ["client.services.request_new"],
      };
      const aliases = aliasChecks[normalized];
      if (!aliases?.length) return false;
      return aliases.some((c) => capabilitySet.has(c));
    },
    [capabilitySet],
  );

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setCapabilities([]);
      setAccount(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/capabilities", { method: "GET", cache: "no-store" });
        const body = (await res.json()) as CapabilitiesApiResponse;
        if (cancelled) return;
        if (!res.ok || !body || (body as any).ok !== true) {
          const message = String((body as any)?.error || `capabilities_fetch_failed_${res.status}`);
          throw new Error(message);
        }
        setCapabilities(Array.isArray(body.capabilities) ? body.capabilities : []);
        setAccount(body.account);
      } catch (e) {
        if (cancelled) return;
        setCapabilities([]);
        setAccount(null);
        setError(e instanceof Error ? e : new Error("Failed to load capabilities"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const isOwner = accountType === "admin";
  const isManager = accountType === "manager";
  const isEmployee = accountType === "employee";
  const isClient = accountType === "client";

  return { capabilities, hasCapability, account, loading, error, isOwner, isManager, isEmployee, isClient };
}

export function useUserCapabilities() {
  const { capabilities, account, loading, error, hasCapability } = useCapabilities();

  const caps = useMemo<UserCapabilities>(() => {
    const type = String((account as any)?.type || "");
    const isOwner = type === "admin";
    const isManager = type === "manager";
    const isEmployee = type === "employee";
    const isClient = type === "client";

    const canCreateTasks = hasCapability("task.create");
    const canUpdateTasks =
      hasCapability("task.update.all") ||
      hasCapability("task.update.team") ||
      hasCapability("task.update.description.own") ||
      hasCapability("task.status.change.own") ||
      hasCapability("task.status.change.team");
    const canDeleteTasks = hasCapability("task.delete.all");
    const canViewAllTasks = hasCapability("task.view.all");

    const canCreateEvents = hasCapability("calendar.create") || hasCapability("calendar.team.create") || hasCapability("calendar.create.own");
    const canUpdateEvents =
      hasCapability("calendar.update") ||
      hasCapability("calendar.team.update") ||
      hasCapability("calendar.update.own");
    const canDeleteEvents = hasCapability("calendar.delete");
    const canViewAllEvents = hasCapability("calendar.view.all");

    const canSendMessages = hasCapability("message.create");
    const canViewAllMessages = hasCapability("message.view.all");

    const canManageUsers = hasCapability("users.invite") || hasCapability("users.invite.limited");
    const canViewAnalytics =
      hasCapability("analytics.view.all") ||
      hasCapability("analytics.view.client_assigned") ||
      hasCapability("analytics.view.relevant") ||
      hasCapability("analytics.view.read_only");
    const canManageServices = hasCapability("client.services.manage");
    const canViewReports = hasCapability("documents.reports.view") || hasCapability("analytics.export.all") || hasCapability("analytics.export.scoped");

    return {
      ...DEFAULT_CAPABILITIES,
      canCreateTasks,
      canUpdateTasks,
      canDeleteTasks,
      canViewAllTasks,
      canCreateEvents,
      canUpdateEvents,
      canDeleteEvents,
      canViewAllEvents,
      canSendMessages,
      canViewAllMessages,
      canManageUsers,
      canViewAnalytics,
      canManageServices,
      canViewReports,
      isOwner,
      isManager,
      isEmployee,
      isClient,
    };
  }, [account, capabilities, hasCapability]);

  return { capabilities: caps, loading, error };
}

export function hasCapability(capabilities: UserCapabilities, capability: keyof UserCapabilities): boolean {
  return capabilities[capability] || false
}

export function requireCapability(capabilities: UserCapabilities, capability: keyof UserCapabilities): void {
  if (!hasCapability(capabilities, capability)) {
    throw new Error(`Missing required capability: ${capability}`)
  }
}
