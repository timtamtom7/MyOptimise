"use client";

import { useState, useEffect } from "react";
import { ALL_CAPABILITIES, ROLE_CAPABILITIES, UserCapabilities } from "@/lib/capabilities";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/use-translation";

interface AccountFormProps {
  action: (formData: FormData) => Promise<void>;
  writeTokenExists: boolean;
  initialData?: {
    email?: string;
    name?: string;
    role?: string;
    status?: string;
    capabilities?: string[];
    revokedCapabilities?: string[];
  };
}

export function AccountForm({ action, writeTokenExists, initialData }: AccountFormProps) {
  const { t } = useTranslation();
  const [role, setRole] = useState(initialData?.role || "employee");
  const [checkedCaps, setCheckedCaps] = useState<Set<string>>(() => {
    if (initialData) {
      const base = ROLE_CAPABILITIES[initialData.role as keyof typeof ROLE_CAPABILITIES] || ROLE_CAPABILITIES["employee"];
      const effective = new Set<string>();
      // Add base
      Object.entries(base).forEach(([k, v]) => {
        if (v) effective.add(k);
      });
      // Add added
      initialData.capabilities?.forEach((c) => effective.add(c));
      // Remove revoked
      initialData.revokedCapabilities?.forEach((c) => effective.delete(c));
      return effective;
    }
    const base = ROLE_CAPABILITIES["employee"] || {};
    const caps = new Set<string>();
    Object.entries(base).forEach(([k, v]) => {
      if (v) caps.add(k);
    });
    return caps;
  });

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    const base = ROLE_CAPABILITIES[newRole] || {};
    const caps = new Set<string>();
    Object.entries(base).forEach(([k, v]) => {
      if (v) caps.add(k);
    });
    setCheckedCaps(caps);
  };

  const toggleCapability = (cap: string) => {
    const next = new Set(checkedCaps);
    if (next.has(cap)) next.delete(cap);
    else next.add(cap);
    setCheckedCaps(next);
  };

  const baseForRole = ROLE_CAPABILITIES[role] || {};
  const added = Array.from(checkedCaps).filter((c) => !baseForRole[c as keyof UserCapabilities]);
  const revoked = Object.keys(baseForRole).filter(
    (c) => baseForRole[c as keyof UserCapabilities] && !checkedCaps.has(c)
  );

  return (
    <form action={action} className="mt-4 grid gap-3 max-w-xl">
      <input
        name="email"
        type="email"
        placeholder={t('emailAddress')}
        required
        className="rounded-md border px-3 py-2"
      />
      <input name="name" placeholder={t('name')} className="rounded-md border px-3 py-2" />
      <select
        name="type"
        className="rounded-md border px-3 py-2"
        value={role}
        onChange={(e) => handleRoleChange(e.target.value)}
      >
        <option value="admin">{t('role_admin')}</option>
        <option value="manager">{t('role_manager')}</option>
        <option value="employee">{t('role_employee')}</option>
        <option value="client">{t('role_client')}</option>
      </select>
      <select name="status" className="rounded-md border px-3 py-2" defaultValue={initialData?.status || "active"}>
        <option value="active">{t('active')}</option>
        <option value="disabled">{t('disabled')}</option>
      </select>
      
      <div className="grid gap-2">
        <label className="text-sm font-medium">{t('account_form_profile_picture')}</label>
        <input type="file" name="avatar" accept="image/*" className="rounded-md border px-3 py-2 text-sm" />
      </div>

      {/* Hidden inputs for capabilities */}
      <input type="hidden" name="capabilities" value={added.join("\n")} />
      <input type="hidden" name="revokedCapabilities" value={revoked.join("\n")} />

      <div className="rounded-md border p-4 space-y-4 max-h-[400px] overflow-y-auto">
        <div className="font-semibold text-sm">{t('capabilities')}</div>
        {Object.entries(
          ALL_CAPABILITIES.reduce((acc, cap) => {
            const [group] = cap.split(".");
            if (!acc[group]) acc[group] = [];
            acc[group].push(cap);
            return acc;
          }, {} as Record<string, string[]>)
        ).map(([group, caps]) => (
          <div key={group} className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">{t('capability_group_' + group.toLowerCase())}</h4>
            <div className="grid grid-cols-1 gap-2">
              {caps.map((cap) => (
                <label
                  key={cap}
                  className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                >
                  <Checkbox
                    checked={checkedCaps.has(cap)}
                    onCheckedChange={() => toggleCapability(cap)}
                  />
                  <span>{t('capability_' + cap.replace(/\./g, '_'))}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <input
        name="password"
        type="password"
        placeholder={t('account_form_password_placeholder')}
        className="rounded-md border px-3 py-2"
      />
      <button
        className="rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
        disabled={!writeTokenExists}
      >
        {t('account_form_save')}
      </button>
    </form>
  );
}
