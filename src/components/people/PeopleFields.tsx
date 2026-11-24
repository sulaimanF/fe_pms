"use client";
import { Controller, useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PeopleSelect from "./PeopleSelect";
import { PEOPLE_JOB_TITLES } from "@/types/people";
import { usePeopleLookups } from "@/hooks/usePeople";
import { isForbidden } from "@/lib/authorization";
import type { PeopleFormValues } from "@/validations/peopleSchema";

export default function PeopleFields({ form, identityEditable, existingOutlet }: {
  form: UseFormReturn<PeopleFormValues>; identityEditable: boolean;
  existingOutlet?: { id: number; name: string; code: string };
}) {
  const lookup = usePeopleLookups();
  const outletId = useWatch({ control: form.control, name: "outletId" });
  const available = lookup.outletsAllowed && !isForbidden(lookup.outlets.error) ? lookup.outlets.data?.data ?? [] : [];
  const active = available.filter(outlet => outlet.is_active);
  const selected = available.find(outlet => String(outlet.id) === outletId);
  const options = active.map(outlet => ({ value: String(outlet.id), label: `${outlet.name} (${outlet.code})` }));
  const codeOptions = active.map(outlet => ({ value: String(outlet.id), label: outlet.code }));
  if (outletId && !options.some(option => option.value === outletId)) options.unshift({ value: outletId, label: existingOutlet && String(existingOutlet.id) === outletId ? `${existingOutlet.name} (tersimpan; belum dapat dipilih ulang)` : "Outlet tersimpan tidak tersedia dalam pilihan" });
  if (outletId && !codeOptions.some(option => option.value === outletId)) codeOptions.unshift({ value: outletId, label: existingOutlet && String(existingOutlet.id) === outletId ? existingOutlet.code : "Kode Outlet tersimpan tidak tersedia" });
  return <div className="grid gap-4 md:grid-cols-2">
    {([ ["name", "Nama", true], ["nip", "NIP", false] ] as const).map(([field, label, required]) => <div key={field} className="space-y-1"><label htmlFor={`people-${field}`} className="text-sm">{label}{required ? " *" : ""}</label><Input id={`people-${field}`} {...form.register(field)} readOnly={!identityEditable} required={required} aria-invalid={!!form.formState.errors[field]} aria-describedby={`people-${field}-error`} /><p id={`people-${field}-error`} role="alert" className="text-sm text-red-600">{form.formState.errors[field]?.message}</p></div>)}
    {!identityEditable && <div><label htmlFor="people-position" className="text-sm">Jabatan organisasi (AD)</label><Input id="people-position" {...form.register("position")} readOnly /></div>}
    <div><Controller control={form.control} name="jobTitle" render={({ field }) => <PeopleSelect id="people-job" label="Job Title" required value={field.value} onChange={field.onChange} options={PEOPLE_JOB_TITLES.map(value => ({ value, label: value }))} />} /><p role="alert" className="text-sm text-red-600">{form.formState.errors.jobTitle?.message}</p><p className="text-xs text-muted-foreground">Master Job Title aktif belum tersedia; kategori ini hanya draft UI.</p></div>
    <div className="space-y-2">
      <Controller control={form.control} name="outletId" render={({ field }) => <PeopleSelect id="people-outlet" label="Lokasi Outlet" required value={field.value} onChange={value => { if (!value || active.some(outlet => String(outlet.id) === value)) field.onChange(value); }} options={options} disabled={!identityEditable || !lookup.outletsAllowed || !lookup.outlets.data || isForbidden(lookup.outlets.error)} />} />
      <p role="alert" className="text-sm text-red-600">{form.formState.errors.outletId?.message}</p>
      {!lookup.outletsAllowed ? <p role="alert" className="text-sm">Lookup memerlukan izin outlet.viewAny.</p> : lookup.outlets.error ? <div role="alert" className="text-sm">Lookup Outlet gagal. Pilihan kosong bukan data yang valid. <Button type="button" variant="outline" disabled={lookup.outlets.isFetching} onClick={() => void lookup.outlets.refetch()}>Coba lagi</Button></div> : lookup.outlets.isPending ? <p role="status">Memuat Outlet...</p> : active.length === 0 ? <p>Tidak ada Outlet aktif yang tersedia.</p> : null}
      {selected && !selected.is_active && <p role="alert" className="text-sm">Outlet tersimpan inactive. Nilai tidak dihapus otomatis.</p>}
    </div>
    <Controller control={form.control} name="outletId" render={({ field }) => <PeopleSelect id="people-outlet-code" label="Kode Outlet" required value={field.value} onChange={value => { if (!value || active.some(outlet => String(outlet.id) === value)) field.onChange(value); }} options={codeOptions} disabled={!identityEditable || !lookup.outletsAllowed || !lookup.outlets.data || isForbidden(lookup.outlets.error)} />} />
    <Controller control={form.control} name="status" render={({ field }) => <PeopleSelect id="people-status" label="Status" required value={field.value} onChange={field.onChange} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />} />
    <p className="text-sm text-muted-foreground md:col-span-2">People inactive tidak dipilih untuk penilaian baru. Perubahan People tidak membuat atau mengubah akun login User PMS. Jabatan manual belum ditampilkan karena kontraknya belum tersedia.</p>
  </div>;
}
