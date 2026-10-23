"use client";

import { useEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import UserRolePicker from "@/components/user/UserRolePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUser, useUserOutletOptions } from "@/hooks/useUsers";
import UserOutletPicker from "@/components/user/UserOutletPicker";
import { UserWriteContractError } from "@/services/userManagement.services";
import { useRoles } from "@/hooks/useRoles";
import { useOrganizationUnits } from "@/hooks/useOrganizationUnits";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { applyFormFailure } from "@/lib/managementForm";
import { buildUserCreate, createUserSchema } from "@/validations/userManagementSchema";
import type { CreateUserFormValues } from "@/validations/userManagementSchema";

const editableFields = ["code", "username", "email", "full_name", "display_name", "phone", "password", "password_confirmation", "organization_unit_id", "is_active", "role_ids", "outlet_ids"] as const;
export default function CreateUserForm() {
  const router = useRouter();
  const mutation = useCreateUser();
  const roleAccess = useAuthorization(ACCESS.roleList);
  const assignmentAccess = useAuthorization(ACCESS.userAssignRoles);
  const rolesQuery = useRoles(true);
  const organizationsQuery = useOrganizationUnits(true);
  const outletsQuery = useUserOutletOptions();
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      code: "", username: "", email: "", full_name: "", display_name: "", phone: "", password: "", password_confirmation: "",
      organization_unit_id: "", is_active: true, role_ids: [], outlet_ids: [],
    },
  });
  const selectedRoles = useWatch({ control: form.control, name: "role_ids" }) ?? [];
  const selectedOutlets = useWatch({ control: form.control, name: "outlet_ids" }) ?? [];
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const pending = mutation.isPending || form.formState.isSubmitting;
  const rolesReady = roleAccess.allowed && !!rolesQuery.data && !rolesQuery.isLoading && !rolesQuery.error;
  const outletsReady = !!outletsQuery.data && !outletsQuery.isLoading && !outletsQuery.error;
  const outlets = outletsQuery.data?.data ?? [];
  const organizationsReady = !!organizationsQuery.data && !organizationsQuery.isLoading && !organizationsQuery.error;
  const organizations = organizationsQuery.data?.data ?? [];
  const roles = rolesReady ? rolesQuery.data?.data ?? [] : [];
  const destination = () => canAccess(ACCESS.userList) ? "/userManagement" : "/dashboard";
  const save = async (values: CreateUserFormValues) => {
    const context = captureSession();
    form.clearErrors();
    if (!canAccess(ACCESS.userCreate)) {
      form.setError("root.server", { message: "Anda tidak memiliki izin untuk menyimpan user." }); return;
    }
    const roleIds = values.role_ids.length ? values.role_ids : undefined;
    if (roleIds !== undefined && (!rolesReady || !canAccess(ACCESS.userAssignRoles))) {
      form.setError("role_ids", { message: "Assignment memerlukan lookup role siap, role.viewAny dan user.update." }); return;
    }
    if (values.outlet_ids.length && (!outletsReady || values.outlet_ids.some((id) => !outlets.some((outlet) => outlet.id === id)))) {
      form.setError("outlet_ids", { message: "Lookup outlet belum siap atau pilihan outlet tidak tersedia." }); return;
    }
    if (values.organization_unit_id && !organizationsReady) {
      form.setError("organization_unit_id", { message: "Lookup organisasi belum siap atau ditolak. Assignment lama tidak diubah." }); return;
    }
    if (values.organization_unit_id &&
      !organizations.some((item) => item.id === Number(values.organization_unit_id))) {
      form.setError("organization_unit_id", { message: "Organisasi yang dipilih tidak tersedia." }); return;
    }
    try {
      await mutation.mutateAsync({ payload: buildUserCreate(values) });
      if (!isCurrentSession(context) || !canAccess(ACCESS.dashboard)) return;
      toast.success("User dan assignment yang diminta berhasil disimpan.");
      router.push(destination());
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context)) return;
      if (error instanceof UserWriteContractError) form.setError("root.server", { message: error.message });
      else applyFormFailure(form, error, editableFields);
    }
  };
  const fieldError = (name: keyof CreateUserFormValues) => <p role="alert" className="text-sm text-red-600">{form.formState.errors[name]?.message}</p>;
  return (
    <form className="max-w-3xl space-y-8" aria-busy={pending} onSubmit={async (event) => {
      event.preventDefault(); if (inFlight.current) return; inFlight.current = true;
      try { await form.handleSubmit(save)(event); } finally { inFlight.current = false; }
    }}>
      <h1 className="text-2xl font-bold">Create User</h1>
      {form.formState.errors.root?.server && <p role="alert">{form.formState.errors.root.server.message}</p>}
      <fieldset disabled={pending} className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-8 gap-y-6">
        <label htmlFor="user-code">Code (opsional)</label><div><Input id="user-code" {...form.register("code")} />{fieldError("code")}</div>
        <label htmlFor="user-login">Login ID</label><div><Input id="user-login" {...form.register("username")} />{fieldError("username")}</div>
        <label htmlFor="user-email">Email</label><div><Input id="user-email" type="email" {...form.register("email")} />{fieldError("email")}</div>
        <label htmlFor="user-fullname">Full Name</label><div><Input id="user-fullname" {...form.register("full_name")} />{fieldError("full_name")}</div>
        <label htmlFor="user-displayname">Display Name (opsional)</label><div><Input id="user-displayname" maxLength={255} {...form.register("display_name")} />{fieldError("display_name")}</div>
        <label htmlFor="user-phone">Phone (opsional)</label><div><Input id="user-phone" type="tel" maxLength={50} {...form.register("phone")} />{fieldError("phone")}</div>
        <label htmlFor="user-password">Password</label>
        <div><Input id="user-password" type="password" autoComplete="new-password" {...form.register("password")} />{fieldError("password")}</div>
        <label htmlFor="user-confirmation">Konfirmasi Password</label>
        <div><Input id="user-confirmation" type="password" autoComplete="new-password" {...form.register("password_confirmation")} />{fieldError("password_confirmation")}</div>
        <label>Organisasi</label>
        <div>
          {organizationsQuery.isLoading ? <p role="status">Memuat seluruh organisasi...</p> :
            organizationsQuery.error ? <p role="alert">{isForbidden(organizationsQuery.error) ? "Akses lookup organisasi ditolak." : "Lookup organisasi gagal dimuat."} <Button type="button" variant="outline" onClick={() => { void organizationsQuery.refetch(); }}>Coba lagi</Button></p> :
            !organizations.length ? <p role="status">Tidak ada organisasi yang tersedia.</p> : null}
          <Controller control={form.control} name="organization_unit_id" render={({ field }) => (
            <Select disabled={!organizationsReady} value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
              <SelectTrigger aria-label="Organisasi" className="w-full"><SelectValue placeholder="Pilih organisasi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa organisasi</SelectItem>
                {organizations.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
          {fieldError("organization_unit_id")}
        </div>
        <label>Status</label><div><Controller control={form.control} name="is_active" render={({ field }) => (
          <Select value={field.value ? "active" : "inactive"} onValueChange={(value) => field.onChange(value === "active")}>
            <SelectTrigger aria-label="Status" className="w-full"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        )} />{fieldError("is_active")}</div>
      </fieldset>
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-8 gap-y-6">
        <label htmlFor="user-roles">Role</label>
        <div className="min-w-0 space-y-3">
          {!roleAccess.allowed ? <p role="alert">Izin role.viewAny diperlukan untuk lookup role. Assignment yang tidak diedit tetap dipertahankan.</p> :
            rolesQuery.isLoading ? <p role="status">Memuat seluruh role...</p> :
            rolesQuery.error ? <p role="alert">{isForbidden(rolesQuery.error) ? "Akses lookup role ditolak." : "Lookup role gagal dimuat."} <Button type="button" variant="outline" onClick={() => { void rolesQuery.refetch(); }}>Coba lagi</Button></p> :
            !roles.length ? <p role="status">Tidak ada role yang tersedia.</p> : null}
          {!assignmentAccess.allowed && <p role="alert">Assignment role membutuhkan user.update; penyimpanan field user tidak membutuhkan izin tambahan ini.</p>}
          <UserRolePicker options={roles} selectedIds={selectedRoles}
            onChange={(ids) => form.setValue("role_ids", ids, { shouldDirty: true })}
            disabled={pending || !rolesReady || !assignmentAccess.allowed || !roles.length}
            invalid={!!form.formState.errors.role_ids} />
          <p className="text-sm text-gray-500">Perubahan daftar mengganti assignment sesuai backend; role yang dikirim menjadi aktif. Role yang tidak terlihat dalam lookup tetap dipertahankan.</p>
          {fieldError("role_ids")}
        </div>
        <label>Outlet Kelolaan</label>
        <div>
          <UserOutletPicker selectedIds={selectedOutlets} onChange={(ids) => form.setValue("outlet_ids", ids, { shouldDirty: true })}
            options={outlets} isLoading={outletsQuery.isLoading} error={outletsQuery.error}
            disabled={pending} onRetry={() => { void outletsQuery.refetch(); }} />
          {fieldError("outlet_ids")}
          <p role="status" className="text-sm">Pilihan outlet disimpan bersama data User melalui Save pada halaman ini.</p>
        </div>
      </div>
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={pending} onClick={() => router.push(destination())}>Cancel</Button>
        <Button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-8 py-2">{pending ? "Menyimpan..." : "Save"}</Button>
      </div>
    </form>
  );
}
