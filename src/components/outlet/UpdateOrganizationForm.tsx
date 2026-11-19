"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import OrganizationFields from "./OrganizationFields";
import OutletRelationPanel from "./OutletRelationPanel";
import type { OutletRelationOption } from "./OutletRelationPanel";
import OrganizationSaveNotice from "./OrganizationSaveNotice";
import { useCheckOrganizationWrite, useOutletOrganizationLookup, useSaveOutletOrganization } from "@/hooks/useOutletOrganizations";
import { useAllOutlets } from "@/hooks/useOutlets";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { applyFormFailure } from "@/lib/managementForm";
import { descendantBranches, editRelationDraft, isOrganizationAncestor, organizationRelationChanges } from "@/lib/outletRelationships";
import type { OutletRelationDraft } from "@/lib/outletRelationships";
import { buildOrganizationUpdate, organizationToForm, updateOrganizationSchema } from "@/validations/organizationUnitSchema";
import type { OrganizationFormValues } from "@/validations/organizationUnitSchema";
import type { OrganizationSaveAttempt, OrganizationUnit } from "@/types/organizationUnit";
export default function UpdateOrganizationForm({ organization }: {
    organization: OrganizationUnit;
}) {
    const [baseline] = useState(organization);
    const router = useRouter(), access = useAuthorization(), mutation = useSaveOutletOrganization(), check = useCheckOrganizationWrite();
    const organizations = useOutletOrganizationLookup(), outlets = useAllOutlets();
    const form = useForm<OrganizationFormValues>({ resolver: zodResolver(updateOrganizationSchema), defaultValues: organizationToForm(baseline) });
    const [parentId, setParentId] = useState(baseline.parent_id), [draft, setDraft] = useState<OutletRelationDraft | null>(null);
    const [attempt, setAttempt] = useState<OrganizationSaveAttempt>(), [checking, setChecking] = useState(false), [saved, setSaved] = useState(false);
    const busy = useRef(false), mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const pending = mutation.isPending || checking || form.formState.isSubmitting, locked = pending || saved || !!attempt;
    const units = organizations.data?.data ?? [], allOutlets = access.can(ACCESS.outletList) && !isForbidden(outlets.error) ? outlets.data?.data ?? [] : [], regional = baseline.unit_type === "wilayah";
    const currentBranches = units.filter(unit => unit.unit_type === "cabang" && unit.parent_id === baseline.id);
    const currentOutlets = allOutlets.filter(outlet => outlet.organization_unit_id === baseline.id);
    const initialIds = (regional ? currentBranches : currentOutlets).map(row => row.id), selectedIds = draft?.selectedIds ?? initialIds;
    const previewUnits = regional && draft ? units.map(unit => draft.selectedIds.includes(unit.id) ? { ...unit, parent_id: baseline.id } : draft.baselineIds.includes(unit.id) ? { ...unit, parent_id: null } : unit) : units;
    const indirectBranches = regional ? descendantBranches(baseline.id, previewUnits) : [];
    const relationRows = regional ? units.filter(unit => selectedIds.includes(unit.id)) : allOutlets.filter(outlet => selectedIds.includes(outlet.id));
    const parentRows: OutletRelationOption[] = units.filter(unit => unit.id === parentId);
    const parentTitle = parentId === null || units.some(unit => unit.id === parentId && unit.unit_type === "wilayah") ? "Kantor Wilayah" : "Organisasi induk";
    if (parentId !== null && !parentRows.length && parentId === baseline.parent_id)
        parentRows.push({ id: parentId, name: baseline.parent?.name ?? `Organisasi #${parentId}`, city: null });
    const destination = () => canAccess(ACCESS.outletList) ? "/outletManagement" : "/dashboard";
    const submitAttempt = async (snapshot: OrganizationSaveAttempt) => {
        const context = captureSession(), result = await mutation.mutateAsync(snapshot);
        if (!mounted.current || !isCurrentSession(context))
            return;
        if (result.uncertain || result.remaining.length) {
            setAttempt(result);
            return;
        }
        setSaved(true);
        const message = result.message?.trim() || "Organisasi dan hubungan yang diedit berhasil disimpan.";
        if (result.synchronizationFailed)
            toast.warning(`${message} Penyimpanan terkonfirmasi, tetapi sinkronisasi tampilan gagal. Jangan ulangi Save.`);
        else
            toast.success(message);
        router.push(destination());
    };
    const save = async (values: OrganizationFormValues) => {
        const context = captureSession();
        if (attempt || saved || !canAccess(ACCESS.organizationUpdate))
            return;
        form.clearErrors();
        if (parentId !== baseline.parent_id && parentId !== null && (organizations.denied || organizations.error || !units.some(unit => unit.id === parentId && unit.unit_type === "wilayah"))) {
            form.setError("root.server", { message: "Lookup parent belum siap atau pilihan tidak tersedia." });
            return;
        }
        if (draft && ((regional && (organizations.error || organizations.denied)) || (!regional && (outlets.error || !access.can(ACCESS.outletUpdate) || !access.can(ACCESS.outletList))))) {
            form.setError("root.server", { message: "Lookup atau izin perubahan hubungan belum siap." });
            return;
        }
        try {
            const payload = buildOrganizationUpdate(values, form.formState.dirtyFields, parentId, baseline.parent_id);
            const names = new Map((regional ? units : allOutlets).map(row => [row.id, row.name]));
            const remaining = organizationRelationChanges(draft, regional ? "organization" : "outlet", names);
            if (!Object.keys(payload).length && !remaining.length) {
                form.setError("root.server", { message: "Tidak ada perubahan untuk disimpan." });
                return;
            }
            await submitAttempt({ id: baseline.id, update: payload, primaryConfirmed: false, remaining, uncertain: false });
        }
        catch (error: unknown) {
            if (mounted.current && isCurrentSession(context)) {
                if (error instanceof Error && !('isAxiosError' in error))
                    form.setError("root.server", { message: error.message });
                else
                    applyFormFailure(form, error, ["code", "name", "province", "city", "is_active"]);
            }
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
    <h1 className="text-2xl font-bold">Update {regional ? "Kantor Wilayah" : "Kantor Cabang"}</h1>
    {form.formState.errors.root?.server && <p role="alert">{form.formState.errors.root.server.message}</p>}
    {attempt && <OrganizationSaveNotice attempt={attempt} pending={pending} onRetry={() => { void retry(); }} onCheck={() => { void inspect(); }}/>}
    <fieldset disabled={locked} className="grid min-w-0 grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <OrganizationFields form={form} title={regional ? "Kantor Wilayah" : "Kantor Cabang"} codeLocked coordinatesUnsupported={!regional}/>
      <div className="space-y-8">
        {regional ? <OutletRelationPanel title="Kantor Cabang" rows={relationRows} options={units.filter(unit => unit.unit_type === "cabang" && !isOrganizationAncestor(unit.id, baseline.id, units)).map(unit => ({ ...unit, parentLabel: units.find(parent => parent.id === unit.parent_id)?.name ?? (unit.parent_id === null ? "Tanpa parent" : `Organisasi #${unit.parent_id}`) }))} onChange={ids => setDraft(current => editRelationDraft(current, initialIds, ids))} disabled={locked || organizations.denied} loading={organizations.isLoading} error={!!organizations.error || organizations.denied} onRetry={() => { void organizations.refetch(); }} reason={organizations.denied ? "Lookup memerlukan org-unit.viewAny." : "Unlink melepaskan parent Cabang, bukan menghapus master."} consequence="Link memindahkan Kantor Cabang yang dipilih dari parent saat ini ke Wilayah ini setelah Save. Outlet di bawah Cabang tetap terhubung ke Cabang tersebut. Unlink hanya melepaskan hubungan parent."/> :
            <OutletRelationPanel title={parentTitle} single rows={parentRows} options={units.filter(unit => unit.unit_type === "wilayah" && !isOrganizationAncestor(baseline.id, unit.id, units))} onChange={ids => setParentId(ids[0] ?? null)} disabled={locked || organizations.denied} loading={organizations.isLoading} error={!!organizations.error || organizations.denied} onRetry={() => { void organizations.refetch(); }} reason="Satu parent. Unlink diperbolehkan karena parent_id organisasi nullable." consequence="Mengganti pilihan akan memindahkan Kantor Cabang ini ke parent yang dipilih saat Save. Hubungan Outlet ke Cabang tetap dipertahankan."/>}
        {regional && indirectBranches.length > 0 && <OutletRelationPanel title="Kantor Cabang turunan" rows={indirectBranches} options={[]} reason="Melalui organisasi antara. Hubungan ini ditampilkan sebagai informasi; tidak diubah langsung dari Wilayah."/>}
        <OutletRelationPanel title="Kantor Cabang Pembantu" rows={regional ? allOutlets.filter(outlet => selectedIds.includes(outlet.organization_unit_id)||indirectBranches.some(branch=>branch.id===outlet.organization_unit_id)) : relationRows} options={regional ? [] : allOutlets.map(outlet => ({ ...outlet, parentLabel: units.find(unit => unit.id === outlet.organization_unit_id)?.name ?? outlet.organization_unit?.name ?? `Organisasi #${outlet.organization_unit_id}` }))} onChange={regional ? undefined : ids => setDraft(current => editRelationDraft(current, initialIds, ids))} canRemove={id => !(draft?.baselineIds ?? initialIds).includes(id)} disabled={locked || !access.can(ACCESS.outletUpdate) || !access.can(ACCESS.outletList)} loading={outlets.isLoading} error={!!outlets.error || !access.can(ACCESS.outletList)} onRetry={() => { void outlets.refetch(); }} reason={!access.can(ACCESS.outletList) ? "Lookup Outlet memerlukan outlet.viewAny." : regional ? "Hubungan turunan melalui Kantor Cabang; ubah melalui Cabang atau Outlet terkait." : !access.can(ACCESS.outletUpdate) || !access.can(ACCESS.outletList) ? "Perubahan memerlukan outlet.viewAny, outlet.view, dan outlet.update." : "Induk Outlet wajib. Outlet existing tidak dapat di-Unlink; pindahkan melalui update Outlet. Pilihan draft baru dapat dibatalkan."} consequence="Link akan memindahkan Outlet yang dipilih dari induk saat ini ke Kantor Cabang ini setelah Save. Riwayat dan master Outlet tidak dihapus."/>
      </div>
    </fieldset>
    <div className="flex justify-end gap-4"><Button type="button" className="min-w-28 bg-gray-200 text-black hover:bg-gray-300" disabled={pending} onClick={() => router.push(destination())}>Cancel</Button><Button type="submit" className="min-w-28 bg-blue-600 text-white hover:bg-blue-700" disabled={locked}>{pending ? "Memproses..." : "Save"}</Button></div>
  </form>;
}
