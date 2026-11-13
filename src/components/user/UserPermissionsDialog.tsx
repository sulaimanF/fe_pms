"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialogs from "@/components/dialogs/ConfirmDialogs";
import { useUserPermissions, useMutateUserPermission } from "@/hooks/useUsers";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useAppSelector } from "@/store/hooks";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { applyFormFailure, readRequestFailure } from "@/lib/managementForm";
import { UserPermissionResponseError } from "@/services/userManagement.services";
import { emptyUserPermission, userPermissionSchema, userPermissionToForm, buildUserPermissionCreate, buildUserPermissionUpdate, userPermissionMatches } from "@/validations/userPermissionSchema";
import type { UserPermissionFormValues } from "@/validations/userPermissionSchema";
import type { UserManagement, UserPermissionOverride, UserPermissionMutation } from "@/types/userManagement";

interface Props {
  user: Pick<UserManagement, "id" | "username">;
  onClose: () => void;
}
const editableFields = ["permission_id", "granted", "reason", "expires_at"] as const;

export default function UserPermissionsDialog({ user, onClose }: Props) {
  const access = useAuthorization();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const query = useUserPermissions(user.id);
  const catalog = usePermissions();
  const mutation = useMutateUserPermission(user.id);
  const [editing, setEditing] = useState<UserPermissionOverride>();
  const [deleting, setDeleting] = useState<UserPermissionOverride>();
  const [uncertain, setUncertain] = useState<UserPermissionMutation>();
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState("");
  const running = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const form = useForm<UserPermissionFormValues>({ resolver: zodResolver(userPermissionSchema), defaultValues: emptyUserPermission });
  const rows = query.data?.data ?? [];
  const ready = !!query.data && !query.error && !query.isFetching;
  const writable = access.can(ACCESS.userManagePermissions) && access.can(ACCESS.userDetail) && user.id !== currentUserId;
  const pending = mutation.isPending || form.formState.isSubmitting || checking;
  const locked = pending || !!uncertain || !ready || !writable;
  const catalogReady = access.can(ACCESS.permissionCatalog) && !!catalog.data && !catalog.isLoading && !catalog.error;
  const options = (catalog.data?.data ?? []).filter((item) => item.is_active && !rows.some((row) => row.permission_id === item.id));
  const reset = () => { setEditing(undefined); form.reset(emptyUserPermission); };
  const requestError = (error: unknown, input: UserPermissionMutation) => {
    // Return to the dialog so a delete failure is visible instead of hidden behind confirmation.
    if (input.kind === "delete") setDeleting(undefined);
    const failure = readRequestFailure(error);
    const unknownOutcome = (error instanceof UserPermissionResponseError && error.mayHaveSaved) ||
      (axios.isAxiosError(error) && (!error.response || error.response.status >= 500 || error.response.status === 404 || error.response.status === 409 ||
        (input.kind === "create" && error.response.status === 422 && !!failure.fields.permission_id)));
    if (unknownOutcome) {
      setUncertain(input); setDeleting(undefined);
      setNotice("Hasil perubahan belum dapat dipastikan. Periksa hasil di server sebelum mencoba lagi; isian tetap dipertahankan.");
    } else if (error instanceof Error && !axios.isAxiosError(error) && !isForbidden(error)) {
      form.setError("root.server", { message: error.message });
    } else applyFormFailure(form, error, editableFields);
  };
  const execute = async (input: UserPermissionMutation) => {
    const context = captureSession();
    if (running.current || uncertain) return;
    form.clearErrors(); setNotice("");
    if (!canAccess(ACCESS.userManagePermissions) || !canAccess(ACCESS.userDetail) || user.id === currentUserId) {
      form.setError("root.server", { message: "Akses perubahan permission ditolak atau target merupakan akun sendiri." }); return;
    }
    if (!ready) { form.setError("root.server", { message: "Muat ulang daftar override sebelum mengubah data." }); return; }
    running.current = true;
    try {
      const response = await mutation.mutateAsync(input);
      if (!mounted.current || !isCurrentSession(context)) return;
      toast.success(typeof response.message === "string" && response.message.trim()
        ? response.message.trim().slice(0, 500)
        : input.kind === "delete" ? "Override dihapus. Akses kembali mengikuti Role." : "Permission khusus berhasil disimpan.");
      if (input.kind !== "delete" || editing?.permission_id === input.permissionId) reset();
      setDeleting(undefined);
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context) || axios.isCancel(error)) return;
      requestError(error, input);
    } finally { running.current = false; }
  };
  const save = async (values: UserPermissionFormValues) => {
    try {
      if (editing) {
        const payload = buildUserPermissionUpdate(values, editing);
        if (!Object.keys(payload).length) { form.setError("root.server", { message: "Tidak ada perubahan permission untuk disimpan." }); return; }
        await execute({ kind: "update", permissionId: editing.permission_id, payload });
      } else {
        const payload = buildUserPermissionCreate(values);
        if (!catalogReady || !options.some((item) => item.id === payload.permission_id)) {
          form.setError("permission_id", { message: "Katalog belum siap atau permission aktif tidak tersedia untuk ditambahkan." }); return;
        }
        await execute({ kind: "create", payload });
      }
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        error.issues.forEach((issue) => {
          const field = editableFields.find((name) => name === issue.path[0]);
          form.setError(field ?? "root.server", { message: issue.message });
        });
      } else form.setError("root.server", { message: error instanceof Error ? error.message : "Isian permission tidak valid." });
    }
  };
  const checkResult = async () => {
    if (!uncertain || running.current) return;
    const context = captureSession();
    running.current = true; setChecking(true);
    try {
      const result = await query.refetch({ throwOnError: true });
      if (!mounted.current || !isCurrentSession(context)) return;
      if (!result.data) throw new Error("Daftar override belum tersedia.");
      const id = uncertain.kind === "create" ? uncertain.payload.permission_id : uncertain.permissionId;
      const row = result.data.data.find((item) => item.permission_id === id);
      const confirmed = uncertain.kind === "delete" ? !row : !!row && userPermissionMatches(row, uncertain.payload);
      if (confirmed) {
        reset(); setNotice("Pembacaan ulang mengonfirmasi hasil perubahan yang diminta.");
      } else {
        setNotice("Daftar terbaru berhasil dimuat. Hasil belum sesuai isian; tinjau data sebelum menyimpan kembali. Tidak ada request simpan yang diulang otomatis.");
      }
      setUncertain(undefined); setDeleting(undefined);
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context) || axios.isCancel(error)) return;
      setNotice(isForbidden(error) ? "Akses pemeriksaan hasil ditolak. Perubahan belum boleh diulang." : "Pemeriksaan hasil gagal. Coba periksa kembali sebelum mengulang perubahan.");
    } finally { running.current = false; if (mounted.current) setChecking(false); }
  };
  const fieldError = (name: keyof UserPermissionFormValues) => form.formState.errors[name]?.message && <p role="alert" className="text-sm text-red-600">{form.formState.errors[name]?.message}</p>;
  return <>
    <Dialog open onOpenChange={(open) => { if (!open && !running.current && !pending) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Tambah Permission Khusus — {user.username}</DialogTitle>
          <DialogDescription>Permission Role tetap diwarisi. Bagian ini hanya untuk tambahan akses atau penolakan khusus pengguna.</DialogDescription>
        </DialogHeader>
        {!writable && <p role="alert">Perubahan memerlukan user.view dan user.managePermission, serta tidak boleh untuk akun sendiri.</p>}
        {query.isLoading && <p role="status">Memuat override pengguna...</p>}
        {!!query.error && <p role="alert">{isForbidden(query.error) ? "Akses membaca override ditolak." : "Override gagal dimuat. Data tidak dianggap kosong."} <Button type="button" variant="outline" disabled={pending || !!uncertain} onClick={() => { void query.refetch(); }}>Coba lagi</Button></p>}
        {query.data && <div className="space-y-3" aria-label="Daftar override">
          {!rows.length && <p role="status">Tidak ada override khusus. Akses mengikuti Role.</p>}
          {rows.map((row) => <div key={row.permission_id} className="space-y-2 rounded-lg border p-3">
            <p className="font-medium break-all">{row.code} <span className="text-sm font-normal">({row.granted ? "Grant" : "Deny"})</span></p>
            {!row.is_active && <p className="text-sm">Permission tidak aktif.</p>}
            <p className="text-sm">Alasan: {row.reason ?? "—"}</p>
            <p className="text-sm">Berlaku sampai: {row.expires_at ? `${row.expires_at} WIB` : "Tanpa batas waktu"}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={locked} onClick={() => { setEditing(row); form.reset(userPermissionToForm(row)); setNotice(""); }}>Ubah</Button>
              <Button type="button" variant="outline" disabled={locked} onClick={() => { form.clearErrors(); setDeleting(row); }}>Hapus Override</Button>
            </div>
          </div>)}
        </div>}
        {notice && <p role="alert">{notice}</p>}
        {uncertain && <Button type="button" variant="outline" disabled={pending} onClick={() => { void checkResult(); }}>{checking ? "Memeriksa..." : "Periksa Hasil di Server"}</Button>}
        <form className="space-y-4 border-t pt-4" aria-busy={pending} onSubmit={(event) => { event.preventDefault(); if (!running.current && !pending) void form.handleSubmit(save)(event); }}>
          <h3 className="font-semibold">{editing ? `Ubah ${editing.code}` : "Tambah Permission Khusus"}</h3>
          {form.formState.errors.root?.server && <p role="alert">{form.formState.errors.root.server.message}</p>}
          {!editing && <>
            {!access.can(ACCESS.permissionCatalog) ? <p role="status">Penambahan pilihan membutuhkan permission.viewAny. Override existing tetap dapat diubah/dihapus sesuai izin.</p> :
              catalog.isLoading ? <p role="status">Memuat data permission...</p> :
              catalog.error ? <p role="alert">Katalog permission gagal dimuat atau akses ditolak. <Button type="button" variant="outline" disabled={pending} onClick={() => { void catalog.refetch(); }}>Coba lagi</Button></p> :
              !options.length ? <p role="status">Tidak ada permission aktif lain yang dapat ditambahkan.</p> : null}
            <label htmlFor="user-permission-choice">Permission <span className="text-red-500">*</span></label>
            <Controller name="permission_id" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange} disabled={locked || !catalogReady}>
              <SelectTrigger id="user-permission-choice" className="w-full"><SelectValue placeholder="Pilih permission" /></SelectTrigger>
              <SelectContent>{options.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.code}</SelectItem>)}</SelectContent>
            </Select>} />
            {fieldError("permission_id")}
          </>}
          <label htmlFor="user-permission-decision">Akses <span className="text-red-500">*</span></label>
          <Controller name="granted" control={form.control} render={({ field }) => <Select value={field.value ? "grant" : "deny"} onValueChange={(value) => field.onChange(value === "grant")} disabled={locked}>
            <SelectTrigger id="user-permission-decision" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="grant">Grant — Berikan akses</SelectItem><SelectItem value="deny">Deny — Tolak akses</SelectItem></SelectContent>
          </Select>} />
          {fieldError("granted")}
          <label htmlFor="user-permission-reason">Alasan</label>
          <Input id="user-permission-reason" maxLength={1000} disabled={locked} {...form.register("reason")} />{fieldError("reason")}
          <label htmlFor="user-permission-expiry">Berlaku sampai (WIB)</label>
          <Input id="user-permission-expiry" type="datetime-local" step="1" disabled={locked} {...form.register("expires_at")} />{fieldError("expires_at")}
          <div className="flex flex-wrap justify-end gap-2">
            {editing && <Button type="button" variant="outline" disabled={pending || !!uncertain} onClick={reset}>Batal Ubah</Button>}
            <Button type="submit" disabled={locked || (!editing && (!catalogReady || !options.length))}>{pending ? "Memproses..." : editing ? "Simpan Perubahan" : "Tambah Permission"}</Button>
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Tutup</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    <ConfirmDialogs open={!!deleting} onOpenChange={(open) => { if (!open && !running.current) setDeleting(undefined); }}
      title="Hapus Override Permission?" description={`Hapus pengecualian ${deleting?.code ?? ""}? Akses kembali mengikuti Role.`}
      confirmText="Hapus Override" cancelText="Batal" loadingText="Menghapus..." closeOnConfirm={false} loading={mutation.isPending}
      onConfirm={() => { if (deleting) void execute({ kind: "delete", permissionId: deleting.permission_id }); }} />
  </>;
}
