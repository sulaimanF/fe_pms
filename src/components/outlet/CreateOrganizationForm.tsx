"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import OrganizationFields from "./OrganizationFields";
import OutletRelationPanel from "./OutletRelationPanel";
import OrganizationSaveNotice from "./OrganizationSaveNotice";
import { useCheckOrganizationWrite, useOutletOrganizationLookup, useSaveOutletOrganization } from "@/hooks/useOutletOrganizations";
import { useAllOutlets } from "@/hooks/useOutlets";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { applyFormFailure } from "@/lib/managementForm";
import { organizationRelationChanges } from "@/lib/outletRelationships";
import { buildOrganizationCreate, createOrganizationSchema, emptyOrganization } from "@/validations/organizationUnitSchema";
import type { OrganizationFormValues } from "@/validations/organizationUnitSchema";
import type { ManagedOrganizationType, OrganizationSaveAttempt } from "@/types/organizationUnit";
export default function CreateOrganizationForm({ type, renderKindPicker }: {
    type: ManagedOrganizationType;
    renderKindPicker: (disabled: boolean) => React.ReactNode;
}) {
    const router = useRouter(), access = useAuthorization(), mutation = useSaveOutletOrganization(), check = useCheckOrganizationWrite();
    const organizations = useOutletOrganizationLookup(type === "cabang"), outlets = useAllOutlets(type === "cabang");
    const form = useForm<OrganizationFormValues>({ resolver: zodResolver(createOrganizationSchema), defaultValues: emptyOrganization });
    const [parentId, setParentId] = useState<number | null>(null), [selectedOutlets, setSelectedOutlets] = useState<number[]>([]);
    const [attempt, setAttempt] = useState<OrganizationSaveAttempt>(), [checking, setChecking] = useState(false), [saved, setSaved] = useState(false);
    const busy = useRef(false), mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const pending = mutation.isPending || checking || form.formState.isSubmitting;
    const locked = pending || saved || !!attempt;
    const units = organizations.data?.data ?? [], allOutlets = access.can(ACCESS.outletList) && !isForbidden(outlets.error) ? outlets.data?.data ?? [] : [];
    const title = type === "wilayah" ? "Kantor Wilayah" : "Kantor Cabang";
    const destination = () => canAccess(ACCESS.outletList) ? "/outletManagement" : "/dashboard";
    const submitAttempt = async (snapshot: OrganizationSaveAttempt) => {
        const context = captureSession();
        const result = await mutation.mutateAsync(snapshot);
        if (!mounted.current || !isCurrentSession(context))
            return;
        if (result.uncertain || result.remaining.length) {
            setAttempt(result);
            return;
        }
        setSaved(true);
        const message = result.message?.trim() || `${title} berhasil disimpan.`;
        if (result.synchronizationFailed)
            toast.warning(`${message} Data tersimpan, tetapi sinkronisasi tampilan gagal. Jangan ulangi Save.`);
        else
            toast.success(message);
        router.push(destination());
    };
    const save = async (values: OrganizationFormValues) => {
        const context = captureSession();
        if (attempt || saved || !canAccess(ACCESS.organizationCreate))
            return;
        form.clearErrors();
        if (parentId !== null && (organizations.denied || organizations.error || !units.some(unit => unit.id === parentId && unit.unit_type === "wilayah"))) {
            form.setError("root.server", { message: "Lookup Kantor Wilayah belum siap atau pilihan tidak tersedia." });
            return;
        }
        if (selectedOutlets.length && (outlets.error || !outlets.data || !canAccess(ACCESS.outletUpdate) || selectedOutlets.some(id => !allOutlets.some(outlet => outlet.id === id)))) {
            form.setError("root.server", { message: "Lookup atau izin perubahan relasi Outlet belum siap." });
            return;
        }
        try {
            const remaining = organizationRelationChanges({ baselineIds: [], selectedIds: selectedOutlets }, "outlet", new Map(allOutlets.map(outlet => [outlet.id, outlet.name])));
            await submitAttempt({ create: buildOrganizationCreate(values, type, type === "cabang" ? parentId : null), primaryConfirmed: false, remaining, uncertain: false });
        }
        catch (error: unknown) {
            if (mounted.current && isCurrentSession(context))
                applyFormFailure(form, error, ["code", "name", "province", "city", "is_active"]);
        }
    };
    const retry = async () => {
        if (!attempt || attempt.uncertain || busy.current)
            return;
        const context = captureSession();
        busy.current = true;
        try {
            await submitAttempt(attempt);
        }
        catch {
            if (mounted.current && isCurrentSession(context))
                form.setError("root.server", { message: "Retry belum berhasil. Tahap terkonfirmasi tidak diulang." });
        }
        finally {
            busy.current = false;
        }
    };
    const inspect = async () => {
        if (!attempt || busy.current)
            return;
        const context = captureSession(), snapshot = attempt;
        busy.current = true;
        setChecking(true);
        try {
            const message = await check(snapshot);
            if (mounted.current && isCurrentSession(context))
                setAttempt({ ...snapshot, issue: message });
        }
        catch (error: unknown) {
            if (mounted.current && isCurrentSession(context))
                setAttempt({ ...snapshot, issue: isForbidden(error) ? "Akses pemeriksaan ditolak; ini bukan bukti penyimpanan gagal." : "Pemeriksaan gagal. Hasil sebelumnya masih belum pasti." });
        }
        finally {
            busy.current = false;
            if (mounted.current && isCurrentSession(context))
                setChecking(false);
        }
    };
    return <form className="space-y-6" aria-busy={pending} onSubmit={async (event) => { event.preventDefault(); if (busy.current || locked)
        return; busy.current = true; try {
        await form.handleSubmit(save)(event);
    }
    finally {
        busy.current = false;
    } }}>
    {form.formState.errors.root?.server && <p role="alert">{form.formState.errors.root.server.message}</p>}
    {attempt && <OrganizationSaveNotice attempt={attempt} pending={pending} onRetry={() => { void retry(); }} onCheck={() => { void inspect(); }}/>}
    <fieldset disabled={locked} className="grid min-w-0 grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <OrganizationFields form={form} title={title} coordinatesUnsupported={type === "cabang"} kindPicker={renderKindPicker(locked)}/>
      {type === "cabang" && <div className="space-y-8">
        <OutletRelationPanel title="Kantor Wilayah" single rows={units.filter(unit => unit.id === parentId)} options={units.filter(unit => unit.unit_type === "wilayah")} onChange={ids => setParentId(ids[0] ?? null)} disabled={locked || organizations.denied} loading={organizations.isLoading} error={!!organizations.error || organizations.denied} onRetry={() => { void organizations.refetch(); }} reason={organizations.denied ? "Lookup memerlukan org-unit.viewAny." : "Opsional sesuai backend. Satu Kantor Cabang memiliki maksimal satu parent."}/>
        <OutletRelationPanel title="Kantor Cabang Pembantu" rows={allOutlets.filter(outlet => selectedOutlets.includes(outlet.id))} options={allOutlets.map(outlet => ({ ...outlet, parentLabel: units.find(unit => unit.id === outlet.organization_unit_id)?.name ?? outlet.organization_unit?.name ?? `Organisasi #${outlet.organization_unit_id}` }))} onChange={ids => setSelectedOutlets(ids)} disabled={locked || !access.can(ACCESS.outletUpdate) || !access.can(ACCESS.outletList)} loading={outlets.isLoading} error={!!outlets.error || !access.can(ACCESS.outletList)} onRetry={() => { void outlets.refetch(); }} reason={!access.can(ACCESS.outletUpdate) || !access.can(ACCESS.outletList) ? "Pemilihan memerlukan outlet.viewAny, outlet.view, dan outlet.update." : "Memilih Outlet existing berarti memindahkan induknya ke Kantor Cabang baru setelah Save."} consequence="Link akan memindahkan Outlet dari induk saat ini ke Kantor Cabang baru setelah Save. Pilihan ini baru draft; Cancel tidak mengubah database."/>
      </div>}
    </fieldset>
    <div className={`flex justify-end gap-4 ${type === "wilayah" ? "lg:w-[calc(45%-1rem)]" : ""}`}><Button type="button" className="min-w-28 bg-gray-200 text-black hover:bg-gray-300" disabled={pending} onClick={() => router.push(destination())}>Cancel</Button><Button type="submit" className="min-w-28 bg-blue-600 text-white hover:bg-blue-700" disabled={locked}>{pending ? "Memproses..." : "Save"}</Button></div>
  </form>;
}
