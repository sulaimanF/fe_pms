"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import { ACCESS, isForbidden } from "@/lib/authorization";

interface PermissionRoleProps {
  selectedPermissions: number[];
  onChange: (permissions: number[]) => void;
  disabled?: boolean;
}
const actionOrder = ["viewAny", "view", "create", "update", "delete", "export", "review", "approve", "reject"];
const labels: Record<string, string> = { viewAny: "View List", view: "View Detail" };

export default function PermissionRole(props: PermissionRoleProps) {
  return <AccessGuard permissions={ACCESS.permissionCatalog}><PermissionRoleContent {...props} /></AccessGuard>;
}
function PermissionRoleContent({ selectedPermissions, onChange, disabled = false }: PermissionRoleProps) {
  const query = usePermissions();
  const [tab, setTab] = useState("");
  const permissions = (query.data?.data ?? []).filter((item) => item.is_active);
  const modules = [...new Set(permissions.map((item) => item.module))];
  const activeTab = modules.includes(tab) ? tab : modules[0] ?? "";
  const selected = new Set(selectedPermissions);
  const toggle = (ids: number[], checked: boolean) => {
    if (disabled) return;
    const next = new Set(selected);
    ids.forEach((id) => { if (checked) next.add(id); else next.delete(id); });
    onChange([...next]);
  };
  if (query.error) return isForbidden(query.error) ? <AccessDenied /> :
    <div role="alert" className="p-6">Katalog permission gagal dimuat. <Button type="button" variant="outline" onClick={() => { void query.refetch(); }}>Coba lagi</Button></div>;
  if (query.isLoading) return <div role="status" className="p-6">Memuat seluruh katalog permission...</div>;
  if (!permissions.length) return <div role="status" className="p-6">Tidak ada permission aktif. Assignment lama tetap dipertahankan.</div>;
  return (
    <Tabs value={activeTab} onValueChange={setTab}>
      <TabsList variant="line" className="w-full h-10 justify-start rounded-none bg-transparent p-0 overflow-x-auto">
        {modules.map((module) => <TabsTrigger key={module} value={module} className="text-[15px]">{module}</TabsTrigger>)}
      </TabsList>
      {modules.map((module) => {
        const items = permissions.filter((item) => item.module === module);
        const actions = [...new Set(items.map((item) => item.action))].sort((a, b) => {
          const index = (v: string) => actionOrder.includes(v) ? actionOrder.indexOf(v) : actionOrder.length;
          return index(a) - index(b) || a.localeCompare(b);
        });
        const resources = [...new Set(items.map((item) => item.resource))];
        return (
          <TabsContent key={module} value={module} className="m-0 overflow-x-auto">
            <table className="w-full">
              <thead><tr className="h-12"><th className="text-left px-6">Resource</th><th>All Access</th>
                {actions.map((action) => <th key={action}>{labels[action] ?? action}</th>)}
              </tr></thead>
              <tbody>{resources.map((resource) => {
                const row = items.filter((item) => item.resource === resource);
                return <tr key={resource} className="border-b h-14">
                  <td className="px-6">{resource}</td>
                  <td className="text-center"><Checkbox aria-label={resource + " all access"} disabled={disabled}
                    checked={row.every((item) => selected.has(item.id))}
                    onCheckedChange={(value) => toggle(row.map((item) => item.id), value === true)} /></td>
                  {actions.map((action) => {
                    const cells = row.filter((item) => item.action === action);
                    return <td key={action} className="text-center">{cells.length ? cells.map((item) =>
                      <label key={item.id} className="inline-flex items-center gap-1"><Checkbox aria-label={item.code}
                        disabled={disabled} checked={selected.has(item.id)}
                        onCheckedChange={(value) => toggle([item.id], value === true)} />
                        {cells.length > 1 && <span className="text-xs">{item.code}</span>}
                      </label>) : <Checkbox disabled aria-label={resource + " " + action + " tidak tersedia"} checked={false} />}</td>;
                  })}
                </tr>;
              })}</tbody>
            </table>
          </TabsContent>
        );
      })}
      <p className="p-4 text-sm text-gray-500">Permission yang sudah ditetapkan tetapi tidak tersedia dalam katalog aktif tetap dipertahankan.</p>
    </Tabs>
  );
}
