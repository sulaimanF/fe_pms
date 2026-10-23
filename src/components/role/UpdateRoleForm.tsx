"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PermissionRole from "@/components/role/PermissionRole";
import { useUpdateRole } from "@/hooks/useRoles";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS, canAccess } from "@/lib/authorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { PartialSaveError, applyFormFailure, sameAssignmentIds } from "@/lib/managementForm";
import { roleSchema } from "@/validations/roleSchema";
import type { RoleFormValues } from "@/validations/roleSchema";
import type { Role, RoleUpdateRequest } from "@/types/role";

interface Props { role: Role }
export default function UpdateRoleForm({ role }: Props) {
  const router = useRouter();
  const mutation = useUpdateRole();
  const catalog = usePermissions();
  const access = useAuthorization(ACCESS.roleAssignPermissions);
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { code: role.code ?? "", name: role.name ?? "", description: role.description ?? "",
      permission_ids: role.permissions?.map((item) => item.id) ?? [] },
  });
  const permissionIds = useWatch({ control: form.control, name: "permission_ids" }) ?? [];
  const [partialId, setPartialId] = useState<number>();
  const originalPermissionIds = useRef(role.permissions?.map((item) => item.id) ?? []);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const pending = mutation.isPending || form.formState.isSubmitting;
  const permissionReady = canAccess(ACCESS.permissionCatalog) && !!catalog.data && !catalog.isLoading && !catalog.error;
  const destination = () => canAccess(ACCESS.roleList) ? "/roleManagement" : "/dashboard";
  const save = async (values: RoleFormValues) => {
    const context = captureSession();
    form.clearErrors();
    if (!canAccess(ACCESS.roleUpdate)) {
      form.setError("root.server", { message: "Anda tidak memiliki izin untuk menyimpan role." }); return;
    }
    const permissions = partialId !== undefined ? values.permission_ids :
      (!sameAssignmentIds(values.permission_ids, originalPermissionIds.current) ? values.permission_ids : undefined);
    if (permissions !== undefined && (!permissionReady || !canAccess(ACCESS.roleAssignPermissions))) {
      form.setError("permission_ids", { message: "Assignment memerlukan katalog siap dan izin role.update." }); return;
    }
    if (permissions !== undefined && !permissions.length) {
      form.setError("permission_ids", { message: "Endpoint sync backend tidak menerima array kosong; minimal satu permission diperlukan." }); return;
    }
    const changed: RoleUpdateRequest = {};
    if (form.formState.dirtyFields.name) changed.name = values.name;
    if (form.formState.dirtyFields.description) changed.description = values.description || null;
    if (!partialId && !Object.keys(changed).length && permissions === undefined) {
      form.setError("root.server", { message: "Tidak ada perubahan untuk disimpan." }); return;
    }
    try {
      await mutation.mutateAsync({
        id: role.id, payload: changed, permissionIds: permissions, resumeId: partialId,
      });
      if (!isCurrentSession(context) || !canAccess(ACCESS.dashboard)) return;
      toast.success("Role dan assignment yang diminta berhasil disimpan.");
      router.push(destination());
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context)) return;
      if (error instanceof PartialSaveError) setPartialId(error.entityId);
      applyFormFailure(form, error, ["code", "name", "description", "permission_ids"]);
    }
  };
  return (
    <form className="space-y-6" aria-busy={pending} onSubmit={async (event) => {
      event.preventDefault(); if (inFlight.current) return; inFlight.current = true;
      try { await form.handleSubmit(save)(event); } finally { inFlight.current = false; }
    }}>
      {partialId && <p role="alert">Role ID {partialId} sudah tersimpan. Save berikutnya hanya mengulang assignment permission; field utama dikunci.</p>}
      {form.formState.errors.root?.server && <p role="alert">{form.formState.errors.root.server.message}</p>}
      <Card className="rounded-3xl shadow-lg"><CardContent className="p-6">
        <fieldset disabled={pending || partialId !== undefined} className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
        <PermissionRole selectedPermissions={permissionIds} disabled={pending || !access.allowed}
          onChange={(ids) => form.setValue("permission_ids", ids, { shouldDirty: true })} />
        <p role="alert" className="p-4">{form.formState.errors.permission_ids?.message}</p>
      </CardContent></Card>
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={pending} onClick={() => router.push(destination())}>Cancel</Button>
        <Button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-15 py-2">{pending ? "Menyimpan..." : partialId ? "Ulangi Assignment" : "Update"}</Button>
      </div>
    </form>
  );
}
