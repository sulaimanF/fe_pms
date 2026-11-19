"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OutletFields from "./OutletFields";
import OutletWriteNotice from "./OutletWriteNotice";
import { useCreateOutlet, useCheckOutletWrite } from "@/hooks/useOutlets";
import { useOutletOrganizationLookup } from "@/hooks/useOutletOrganizations";
import OutletParentPanel from "./OutletParentPanel";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { applyFormFailure } from "@/lib/managementForm";
import { OutletWriteUncertainError } from "@/services/outlet.service";
import {
  buildOutletCreate,
  createOutletSchema,
  emptyOutlet,
  outletEditableFields,
} from "@/validations/outletSchema";
import type { OutletFormValues } from "@/validations/outletSchema";
import type { OutletCreateRequest } from "@/types/outlet";

export default function CreateOutletForm({renderKindPicker}:{renderKindPicker:(disabled:boolean)=>React.ReactNode}) {
  const router = useRouter();
  const mutation = useCreateOutlet();
  const checkResult = useCheckOutletWrite();
  const organizations = useOutletOrganizationLookup();
  const form = useForm<OutletFormValues>({
    resolver: zodResolver(createOutletSchema),
    defaultValues: emptyOutlet,
  });
  const [uncertain, setUncertain] = useState<{
    payload: OutletCreateRequest;
    id?: number;
    message: string;
  }>();
  const [checking, setChecking] = useState(false);
  const [saved, setSaved] = useState(false);
  const running = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const pending = mutation.isPending || form.formState.isSubmitting || checking;
  const destination = () =>
    canAccess(ACCESS.outletList) ? "/outletManagement" : "/dashboard";
  const save = async (values: OutletFormValues) => {
    if (uncertain || saved || checking) return;
    const context = captureSession();
    form.clearErrors();
    if (!canAccess(ACCESS.outletCreate)) {
      form.setError("root.server", { message: "Akses create Outlet ditolak." });
      return;
    }
    if (
      !organizations.data ||
      organizations.denied ||
      organizations.error ||
      !organizations.data.data.some(
        (item) => item.id === Number(values.organization_unit_id) && item.unit_type === "cabang",
      )
    ) {
      form.setError("organization_unit_id", {
        message:
          "Lookup organisasi belum siap, ditolak, atau pilihan tidak tersedia.",
      });
      return;
    }
    const payload = buildOutletCreate(values),
      snapshot = structuredClone(payload);
    try {
      const response = await mutation.mutateAsync(payload);
      if (!mounted.current || !isCurrentSession(context)) return;
      setSaved(true);
      const message =
        typeof response.message === "string" && response.message.trim()
          ? response.message.trim().slice(0, 500)
          : "Outlet berhasil dibuat.";
      if (response.synchronizationFailed)
        toast.warning(
          `${message} Penyimpanan terkonfirmasi, tetapi sinkronisasi data gagal. Jangan ulangi Save.`,
        );
      else toast.success(message);
      if (canAccess(ACCESS.dashboard)) router.push(destination());
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context)) return;
      if (error instanceof OutletWriteUncertainError)
        setUncertain({
          payload: snapshot,
          id: error.entityId,
          message: error.message,
        });
      else applyFormFailure(form, error, outletEditableFields);
    }
  };
  const check = async () => {
    if (!uncertain || running.current) return;
    const context = captureSession(),
      attempt = uncertain;
    running.current = true;
    setChecking(true);
    try {
      const message = await checkResult(attempt.payload, attempt.id);
      if (mounted.current && isCurrentSession(context))
        setUncertain({ ...attempt, message });
    } catch (error: unknown) {
      if (mounted.current && isCurrentSession(context))
        setUncertain({
          ...attempt,
          message: isForbidden(error)
            ? "Akses pemeriksaan ditolak. Ini bukan bukti Outlet belum tersimpan."
            : "Pemeriksaan belum berhasil. Hasil penyimpanan masih belum pasti.",
        });
    } finally {
      running.current = false;
      if (mounted.current && isCurrentSession(context)) setChecking(false);
    }
  };
  return (
    <form
      className="space-y-6"
      aria-busy={pending}
      onSubmit={async (event) => {
        event.preventDefault();
        if (running.current || pending || uncertain || saved) return;
        running.current = true;
        try {
          await form.handleSubmit(save)(event);
        } finally {
          running.current = false;
        }
      }}
    >
      {form.formState.errors.root?.server && (
        <p role="alert">{form.formState.errors.root.server.message}</p>
      )}
      {uncertain && (
        <OutletWriteNotice
          message={uncertain.message}
          pending={pending}
          onCheck={() => {
            void check();
          }}
          onRelease={() => {
            if (!running.current) setUncertain(undefined);
          }}
        />
      )}
      <fieldset
        disabled={pending || saved}
        className="grid min-w-0 grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      >
        <Card className="rounded-2xl bg-white py-6 shadow-lg"><CardContent className="space-y-4">
        {renderKindPicker(pending || saved || !!uncertain)}
        <div>
        <label htmlFor="outlet-code">
          Kode <span className="text-red-500">*</span>
        </label>
        <div>
          <Input id="outlet-code" maxLength={50} {...form.register("code")} />
          <p role="alert" className="text-sm text-red-600">
            {form.formState.errors.code?.message}
          </p>
        </div>
        </div>
        <OutletFields form={form}/>
        </CardContent></Card>
        <OutletParentPanel form={form} units={organizations.data?.data??[]} loading={organizations.isLoading} error={organizations.error} denied={organizations.denied} onRetry={()=>{void organizations.refetch();}} disabled={pending||saved||!!uncertain}/>
      </fieldset>
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          className="min-w-28 bg-gray-200 text-black hover:bg-gray-300"
          disabled={pending}
          onClick={() => router.push(destination())}
        >
          Cancel
        </Button>
        <Button type="submit" className="min-w-28 bg-blue-600 text-white hover:bg-blue-700" disabled={pending || !!uncertain || saved}>
          {pending ? "Memproses..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
