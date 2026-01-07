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
      };
      
      const aliases = aliasChecks[normalized];
      if (aliases) {
        return aliases.some((alias) => capabilitySet.has(alias));
      }

      return false;
    },
    [capabilitySet]
  );

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
        setLoading(false);
        return;
    }

    let mounted = true;
    async function fetchCapabilities() {
        try {
            console.log('[useCapabilities] Fetching capabilities...');
            const res = await fetch("/api/capabilities");
            if (!res.ok) {
                console.error('[useCapabilities] Failed to fetch:', res.status, res.statusText);
                throw new Error("Failed to fetch capabilities");
            }
            const data: CapabilitiesApiResponse = await res.json();
            console.log('[useCapabilities] Data received:', data);
            if (mounted) {
                if (data.ok) {
                    setCapabilities(data.capabilities);
                    setAccount(data.account);
                } else {
                    console.error('[useCapabilities] API returned error:', data.error);
                    setError(new Error(data.error));
                }
            }
        } catch (err) {
            console.error('[useCapabilities] Error:', err);
            if (mounted) {
                setError(err instanceof Error ? err : new Error("Unknown error"));
            }
        } finally {
            if (mounted) setLoading(false);
        }
    }
    fetchCapabilities();
    return () => { mounted = false; };
  }, [status]);

  return { capabilities, account, loading, error, hasCapability };
}

export function useCalendarPermissions() {
  const { hasCapability } = useCapabilities();
  return {
    canCreate: hasCapability("calendar.create"),
    canUpdate: hasCapability("calendar.update"),
    canDelete: hasCapability("calendar.delete"),
    canViewAll: hasCapability("calendar.view.all"),
  };
}

export function useTaskPermissions() {
  const { hasCapability } = useCapabilities();
  return {
    canCreate: hasCapability("task.create"),
    canUpdate: hasCapability("task.update.all"), // Or task.update depending on granular logic, but admin has update.all
    canDelete: hasCapability("task.delete.all"),
    canViewAll: hasCapability("task.view.all"),
  };
}
