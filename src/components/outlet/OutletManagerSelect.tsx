"use client";

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers } from "@/hooks/useUsers";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import type { OutletFormValues } from "@/validations/outletSchema";
import type { Outlet } from "@/types/outlet";

export default function OutletManagerSelect({ form, currentManager }: {
  form: UseFormReturn<OutletFormValues>;
  currentManager?: Outlet["manager"];
}) {
  const access = useAuthorization(ACCESS.userList);
  const query = useUsers();
  const users = access.allowed && !isForbidden(query.error)
    ? (query.data?.data ?? []).filter(user => !user.roles?.some(role => role.code === "super-admin"))
    : [];
  const unavailable = !access.allowed || query.isLoading || !!query.error || !query.data;

  return <div>
    <label htmlFor="outlet-manager" className="mb-1 block text-sm">Manager</label>
    <Controller control={form.control} name="manager_user_id" render={({ field }) => (
      <Select value={field.value || "none"} disabled={unavailable} onValueChange={value => {
        if (!canAccess(ACCESS.userList) || unavailable) return;
        if (value === "none" || users.some(user => String(user.id) === value)) field.onChange(value === "none" ? "" : value);
      }}>
        <SelectTrigger id="outlet-manager" className="w-full" aria-describedby="outlet-manager-status outlet-manager-error" aria-invalid={!!form.formState.errors.manager_user_id}>
          <SelectValue placeholder="Pilih manager">
            {field.value && !users.some(user => String(user.id) === field.value)
              ? currentManager && String(currentManager.id) === field.value
                ? "Manager tersimpan tidak tersedia dalam pilihan"
                : "Pilihan manager tidak tersedia"
              : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Tanpa manager</SelectItem>
          {users.map(user => <SelectItem key={user.id} value={String(user.id)}>{user.full_name || user.username} ({user.username})</SelectItem>)}
        </SelectContent>
      </Select>
    )} />
    <div id="outlet-manager-status" className="text-xs text-muted-foreground">
      {!access.allowed ? <p>Akses daftar manager memerlukan izin user.viewAny. Pilihan yang sudah tersimpan tetap dipertahankan.</p> :
        query.error ? <div role="alert"><p>Daftar manager gagal dimuat. Pilihan saat ini tetap dipertahankan.</p><Button type="button" variant="outline" size="sm" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>Coba lagi</Button></div> :
          query.isLoading ? <p role="status">Memuat daftar manager...</p> : query.data && !users.length ? <p>Belum ada User yang dapat dipilih sebagai manager.</p> : null}
    </div>
    <p id="outlet-manager-error" role="alert" className="text-xs text-red-600">{form.formState.errors.manager_user_id?.message}</p>
  </div>;
}
