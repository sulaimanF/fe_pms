"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import OutletFields from "./OutletFields";
import OutletWriteNotice from "./OutletWriteNotice";
import { useCreateOutlet, useCheckOutletWrite } from "@/hooks/useOutlets";
import { useOrganizationUnits } from "@/hooks/useOrganizationUnits";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { applyFormFailure } from "@/lib/managementForm";
import { OutletWriteUncertainError } from "@/services/outlet.service";
import { buildOutletCreate, createOutletSchema, emptyOutlet, outletEditableFields } from "@/validations/outletSchema";
import type { OutletFormValues } from "@/validations/outletSchema";
import type { OutletCreateRequest } from "@/types/outlet";

export default function CreateOutletForm() {
  const router = useRouter();
  const mutation = useCreateOutlet();
  const checkResult = useCheckOutletWrite();
  const organizations = useOrganizationUnits(true);
  const form = useForm<OutletFormValues>({ resolver: zodResolver(createOutletSchema), defaultValues: emptyOutlet });
  const [uncertain, setUncertain] = useState<{ payload: OutletCreateRequest; id?: number; message: string }>();
  const [checking, setChecking] = useState(false);
  const [saved, setSaved] = useState(false);
  const running = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const pending = mutation.isPending || form.formState.isSubmitting || checking;
  const destination = () => canAccess(ACCESS.outletList) ? "/outletManagement" : "/dashboard";
  const save = async (values: OutletFormValues) => {
    if (uncertain || saved || checking) return;
    const context = captureSession();
    form.clearErrors();
    if (!canAccess(ACCESS.outletCreate)) { form.setError("root.server", { message: "Akses create Outlet ditolak." }); return; }
    if (!organizations.data || organizations.error || !organizations.data.data.some((item) => item.id === Number(values.organization_unit_id))) {
      form.setError("organization_unit_id", { message: "Lookup organisasi belum siap, ditolak, atau pilihan tidak tersedia." }); return;
    }
    const payload = buildOutletCreate(values), snapshot = structuredClone(payload);
    try {
      const response = await mutation.mutateAsync(payload);
      if (!mounted.current || !isCurrentSession(context)) return;
      setSaved(true);
      const message = typeof response.message === "string" && response.message.trim() ? response.message.trim().slice(0, 500) : "Outlet berhasil dibuat.";
      if (response.synchronizationFailed) toast.warning(`${message} Penyimpanan terkonfirmasi, tetapi sinkronisasi data gagal. Jangan ulangi Save.`);
      else toast.success(message);
      if (canAccess(ACCESS.dashboard)) router.push(destination());
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context)) return;
      if (error instanceof OutletWriteUncertainError) setUncertain({ payload: snapshot, id: error.entityId, message: error.message });
      else applyFormFailure(form, error, outletEditableFields);
    }
  };
  const check = async () => {
    if (!uncertain || running.current) return;
    const context = captureSession(), attempt = uncertain;
    running.current = true; setChecking(true);
    try {
      const message = await checkResult(attempt.payload, attempt.id);
      if (mounted.current && isCurrentSession(context)) setUncertain({ ...attempt, message });
    } catch (error: unknown) {
      if (mounted.current && isCurrentSession(context)) setUncertain({ ...attempt, message: isForbidden(error) ? "Akses pemeriksaan ditolak. Ini bukan bukti Outlet belum tersimpan." : "Pemeriksaan belum berhasil. Hasil penyimpanan masih belum pasti." });
    } finally { running.current = false; if (mounted.current && isCurrentSession(context)) setChecking(false); }
  };
  return <form className="max-w-3xl space-y-8" aria-busy={pending} onSubmit={async (event) => {
    event.preventDefault(); if (running.current || pending || uncertain || saved) return; running.current = true;
    try { await form.handleSubmit(save)(event); } finally { running.current = false; }
  }}>
    <h1 className="text-2xl font-bold">Create Outlet</h1>
    {form.formState.errors.root?.server && <p role="alert">{form.formState.errors.root.server.message}</p>}
    {uncertain && <OutletWriteNotice message={uncertain.message} pending={pending} onCheck={() => { void check(); }} onRelease={() => { if (!running.current) setUncertain(undefined); }} />}
    <fieldset disabled={pending || saved} className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-[180px_1fr]">
      <label htmlFor="outlet-code">Kode <span className="text-red-500">*</span></label>
      <div><Input id="outlet-code" maxLength={50} {...form.register("code")} /><p role="alert" className="text-sm text-red-600">{form.formState.errors.code?.message}</p></div>
      <OutletFields form={form} organizations={organizations.data?.data ?? []} loading={organizations.isLoading} error={organizations.error} onRetry={() => { void organizations.refetch(); }} />
    </fieldset>
    <p className="text-sm text-muted-foreground">Negara kosong menggunakan default database backend. Status dan manager berbeda dari assignment User ke Outlet.</p>
    <div className="flex justify-end gap-4"><Button type="button" variant="outline" disabled={pending} onClick={() => router.push(destination())}>Cancel</Button><Button type="submit" disabled={pending || !!uncertain || saved}>{pending ? "Memproses..." : "Save"}</Button></div>
  </form>;
}
