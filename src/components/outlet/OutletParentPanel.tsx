"use client";
import { useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { OutletFormValues } from "@/validations/outletSchema";
import type { OrganizationUnit } from "@/types/organizationUnit";
import OutletRelationPanel from "./OutletRelationPanel";
import type { OutletRelationOption } from "./OutletRelationPanel";
export default function OutletParentPanel({ form, units, loading, error, denied, onRetry, disabled, currentOrganization }: {
    form: UseFormReturn<OutletFormValues>;
    units: OrganizationUnit[];
    loading: boolean;
    error: unknown;
    denied: boolean;
    onRetry: () => void;
    disabled: boolean;
    currentOrganization?: {
        id: number;
        name: string;
    };
}) {
    const value = useWatch({ control: form.control, name: "organization_unit_id" }), id = Number(value), selected = units.find(unit => unit.id === id);
    const rows: OutletRelationOption[] = selected ? [selected] : currentOrganization && currentOrganization.id === id ? [currentOrganization] : [];
    const visited = new Set<number>();
    let current = selected;
    let region: OrganizationUnit | undefined;
    while (current && !visited.has(current.id)) {
        visited.add(current.id);
        if (current.unit_type === "wilayah") {
            region = current;
            break;
        }
        current = units.find(unit => unit.id === current?.parent_id);
    }
    return <div className="space-y-8">
    <OutletRelationPanel title={selected && selected.unit_type !== "cabang" || (!selected && currentOrganization) ? "Organisasi induk" : "Kantor Cabang"} single rows={rows} options={units.filter(unit => unit.unit_type === "cabang")} onChange={ids => { if (ids[0])
        form.setValue("organization_unit_id", String(ids[0]), { shouldDirty: true, shouldValidate: true }); }} canRemove={() => false} disabled={disabled || denied} loading={loading} error={!!error || denied} onRetry={onRetry} reason={denied ? "Lookup organisasi memerlukan org-unit.viewAny." : "Satu induk wajib. Link dapat mengganti induk; Unlink tidak tersedia karena organization_unit_id tidak menerima null."} consequence="Memilih Kantor Cabang lain akan memindahkan Outlet ini dari induk saat ini setelah Save. Ini hanya draft sampai Save; Cancel tidak mengubah database."/>
    {form.formState.errors.organization_unit_id && <p role="alert" className="text-sm text-red-600">{form.formState.errors.organization_unit_id.message}</p>}
    <OutletRelationPanel title="Kantor Wilayah" rows={region ? [region] : []} options={[]} reason="Informasi turunan melalui organisasi induk. Hubungan Wilayah diubah melalui organisasi terkait." loading={loading} error={!!error || denied}/>
  </div>;
}
