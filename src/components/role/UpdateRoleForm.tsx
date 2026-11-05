"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PermissionRole from "@/components/role/PermissionRole";
import MenuRole from "@/components/role/MenuRole";
import { roleUpdateDraftKey, useRoleMenus, useUpdateRole } from "@/hooks/useRoles";
import { usePermissions } from "@/hooks/usePermissions";
import { useMenuCatalog } from "@/hooks/useMenu";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { applyFormFailure, sameAssignmentIds } from "@/lib/managementForm";
import { roleSchema, validateRoleMenuSelection } from "@/validations/roleSchema";
import type { RoleFormValues, RoleFormDraft } from "@/validations/roleSchema";
import type { Role, RoleMenu, RoleUpdateRequest } from "@/types/role";

interface Props { role: Role }
export default function UpdateRoleForm({ role }: Props) {
  const menus = useRoleMenus(role.id);
  if (!menus.data) {
    if (menus.isLoading) return <p role="status">Memuat assignment menu role...</p>;
    return <div role="alert"><p>{isForbidden(menus.error) ? "Akses assignment menu role ditolak oleh server." : "Assignment menu role belum berhasil dimuat. Form belum siap untuk disimpan."}</p>
      <Button type="button" variant="outline" onClick={() => { void menus.refetch(); }}>Coba lagi</Button></div>;
  }
  return <>
    {menus.error && <p role="alert">Pemuatan ulang assignment menu gagal. Draft yang sedang diedit tetap dipertahankan.</p>}
    <UpdateRoleFields key={role.id} role={role} initialMenus={menus.data.data} />
  </>;
}

function UpdateRoleFields({ role, initialMenus }: Props & { initialMenus: RoleMenu[] }) {
  const router = useRouter();
  const mutation = useUpdateRole();
  const catalog = usePermissions();
  const menuCatalog = useMenuCatalog();
  const client = useQueryClient();
  const draftKey = roleUpdateDraftKey(captureSession().id, role.id);
  const cachedDraft = useQuery<RoleFormDraft>({ queryKey: draftKey, queryFn: skipToken, gcTime: Infinity,
    meta: { scope: "session", sessionId: captureSession().id } });
  const [draft] = useState(() => client.getQueryData<RoleFormDraft>(draftKey));
  const [baseline] = useState<RoleFormValues>(() => draft?.baseline ?? {
    code: role.code ?? "", name: role.name ?? "", description: role.description ?? "",
    permission_ids: role.permissions?.map((item) => item.id) ?? [], menu_ids: initialMenus.map((item) => item.id),
  });
  const [progress, setProgress] = useState(draft?.progress);
  const [unconfirmed, setUnconfirmed] = useState(draft?.unconfirmed ?? false);
  const [issue, setIssue] = useState(draft?.issue);
  const complete = cachedDraft.data?.complete ?? draft?.complete ?? false;
  const access = useAuthorization(ACCESS.roleAssignPermissions);
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: draft?.values ?? baseline,
  });
  const permissionIds = useWatch({ control: form.control, name: "permission_ids" }) ?? [];
  const menuIds = useWatch({ control: form.control, name: "menu_ids" }) ?? [];
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const pending = mutation.isPending || form.formState.isSubmitting;
  const permissionReady = canAccess(ACCESS.permissionCatalog) && !!catalog.data && !catalog.isLoading && !catalog.error;
  const menuReady = canAccess(ACCESS.menuCatalog) && !!menuCatalog.data && !menuCatalog.isLoading && !menuCatalog.error;
  const destination = () => canAccess(ACCESS.roleList) ? "/roleManagement" : "/dashboard";
  const save = async (values: RoleFormValues) => {
    const context = captureSession();
    form.clearErrors();
    if (complete || unconfirmed) return;
    setIssue(undefined);
    if (!canAccess(ACCESS.roleUpdate)) {
      form.setError("root.server", { message: "Anda tidak memiliki izin untuk menyimpan role." }); return;
    }
    const permissions = progress ? (progress.pending.includes("permissions") ? values.permission_ids : undefined) :
      (!sameAssignmentIds(values.permission_ids, baseline.permission_ids) ? values.permission_ids : undefined);
    const menus = progress ? (progress.pending.includes("menus") ? values.menu_ids : undefined) :
      (!sameAssignmentIds(values.menu_ids, baseline.menu_ids) ? values.menu_ids : undefined);
    if (permissions !== undefined && (!permissionReady || !canAccess(ACCESS.roleAssignPermissions))) {
      form.setError("permission_ids", { message: "Assignment memerlukan katalog siap dan izin role.update." }); return;
    }
    if (permissions !== undefined && !permissions.length) {
      form.setError("permission_ids", { message: "Endpoint sync backend tidak menerima array kosong; minimal satu permission diperlukan." }); return;
    }
    if (menus !== undefined) {
      if (!menuReady || !canAccess(ACCESS.roleAssignMenus)) {
        form.setError("menu_ids", { message: "Assignment menu memerlukan katalog siap, menu.viewAny, dan role.update." }); return;
      }
      const menuError = !menus.length ? "Endpoint sync backend tidak menerima menu kosong." : validateRoleMenuSelection(menus, menuCatalog.data!.data, baseline.menu_ids);
      if (menuError) { form.setError("menu_ids", { message: menuError }); return; }
    }
    const changed: RoleUpdateRequest = {};
    if (values.name !== baseline.name) changed.name = values.name;
    if (values.description.trim() !== baseline.description.trim()) changed.description = values.description.trim() || null;
    if (!progress && !Object.keys(changed).length && permissions === undefined && menus === undefined) {
      form.setError("root.server", { message: "Tidak ada perubahan untuk disimpan." }); return;
    }
    client.setQueryData<RoleFormDraft>(draftKey, { values, baseline, progress });
    try {
      await mutation.mutateAsync({
        id: role.id, payload: changed, permissionIds: permissions, menuIds: menus, resume: progress,
      });
      if (!isCurrentSession(context) || !canAccess(ACCESS.dashboard)) return;
      client.removeQueries({ queryKey: draftKey, exact: true });
      router.push(destination());
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context)) return;
      const saved = client.getQueryData<RoleFormDraft>(draftKey);
      setProgress(saved?.progress);
      setUnconfirmed(saved?.unconfirmed ?? false);
      setIssue(saved?.issue);
      applyFormFailure(form, error, ["code", "name", "description", "permission_ids", "menu_ids"]);
      if (saved?.unconfirmed) form.setError("root.server", { message: saved.issue });
    }
  };
  return (
    <form className="space-y-6" aria-busy={pending} onSubmit={async (event) => {
      event.preventDefault(); if (inFlight.current) return; inFlight.current = true;
      try { await form.handleSubmit(save)(event); } finally { inFlight.current = false; }
    }}>
      {progress && <p role="alert">Role ID {progress.entityId} sudah tersimpan. Tahap yang perlu diselesaikan: {progress.pending.join(", ")}. Retry tidak mengulang field utama atau tahap yang sudah dikonfirmasi.</p>}
      {complete && <p role="status">Role sudah berhasil disimpan. Gunakan Kembali untuk meninggalkan form ini.</p>}
      {(form.formState.errors.root?.server?.message || issue) && <p role="alert">{form.formState.errors.root?.server?.message || issue}</p>}
      {unconfirmed && <Button type="button" variant="outline" disabled={pending} onClick={() => {
        setUnconfirmed(false); setIssue(undefined); form.clearErrors("root.server");
        client.setQueryData<RoleFormDraft>(draftKey, (saved) => saved ? { ...saved, unconfirmed: false, issue: undefined } : undefined);
      }}>Sudah memeriksa hasil di daftar/backend, izinkan percobaan ulang</Button>}
      <Card className="rounded-3xl shadow-lg"><CardContent className="p-6">
        <fieldset disabled={pending || !!progress || complete || unconfirmed} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div><Input aria-label="Role Code" placeholder="Role Code" {...form.register("code")} readOnly className="h-14 rounded-xl" />
            <p role="alert">{form.formState.errors.code?.message}</p></div>
          <div><Input aria-label="Role Name" placeholder="Role Name" {...form.register("name")} className="h-14 rounded-xl" />
            <p role="alert">{form.formState.errors.name?.message}</p></div>
          <div><Input aria-label="Description Role" placeholder="Description Role" {...form.register("description")} className="h-14 rounded-xl" />
            <p role="alert">{form.formState.errors.description?.message}</p></div>
        </fieldset>
      </CardContent></Card>
      <Card className="rounded-3xl shadow-lg"><CardContent className="min-h-[550px] p-0">
        {!access.allowed && <p role="alert" className="p-4">Assignment permission memerlukan role.update. Field role tetap dapat disimpan sesuai izin halaman.</p>}
        <PermissionRole selectedPermissions={permissionIds} disabled={pending || !access.allowed || complete || unconfirmed || (!!progress && !progress.pending.includes("permissions"))}
          onChange={(ids) => form.setValue("permission_ids", ids, { shouldDirty: true })} />
        <p role="alert" className="p-4">{form.formState.errors.permission_ids?.message}</p>
      </CardContent></Card>
      <Card className="rounded-3xl shadow-lg"><CardContent className="space-y-4 p-6">
        <h2 className="font-semibold">Menu Sidebar</h2>
        {!access.allowed && <p role="alert">Assignment menu memerlukan role.update.</p>}
        <MenuRole selectedMenus={menuIds} disabled={pending || !access.allowed || complete || unconfirmed || (!!progress && !progress.pending.includes("menus"))}
          onChange={(ids) => form.setValue("menu_ids", ids, { shouldDirty: true })} />
        <p role="alert">{form.formState.errors.menu_ids?.message}</p>
      </CardContent></Card>
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={pending} onClick={() => {
          client.removeQueries({ queryKey: draftKey, exact: true }); router.push(destination());
        }}>{complete ? "Kembali" : "Cancel"}</Button>
        <Button type="submit" disabled={pending || complete || unconfirmed} className="rounded-lg bg-blue-600 px-15 py-2">{pending ? "Menyimpan..." : progress ? "Ulangi Assignment" : "Update"}</Button>
      </div>
    </form>
  );
}
