"use client";

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OUTLET_TYPES } from "@/types/outlet";
import type { OutletFormValues } from "@/validations/outletSchema";
import type { OrganizationUnit } from "@/types/organizationUnit";
import { isForbidden } from "@/lib/authorization";

interface Props {
  form: UseFormReturn<OutletFormValues>;
  organizations: readonly OrganizationUnit[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  currentOrganization?: { id: number; name: string };
}
// Presentational fields only. Create and Update own initialization, validation and submission.
export default function OutletFields({ form, organizations, loading, error, onRetry, currentOrganization }: Props) {
  const fieldError = (name: keyof OutletFormValues) => <p role="alert" className="text-sm text-red-600">{form.formState.errors[name]?.message}</p>;
  return <>
    <label htmlFor="outlet-name">Nama <span className="text-red-500">*</span></label>
    <div><Input id="outlet-name" maxLength={255} {...form.register("name")} />{fieldError("name")}</div>
    <label htmlFor="outlet-organization">Organisasi <span className="text-red-500">*</span></label>
    <div>
      {loading ? <p role="status">Memuat seluruh organisasi...</p> : error ? <p role="alert">{isForbidden(error) ? "Akses lookup organisasi ditolak." : "Lookup organisasi gagal dimuat."} <Button type="button" variant="outline" onClick={onRetry}>Coba lagi</Button></p> : !organizations.length ? <p role="status">Tidak ada organisasi tersedia.</p> : null}
      <Controller control={form.control} name="organization_unit_id" render={({ field }) => <Select value={field.value} onValueChange={field.onChange} disabled={loading || !!error}>
        <SelectTrigger id="outlet-organization" aria-required="true" className="w-full"><SelectValue placeholder="Pilih organisasi" /></SelectTrigger>
        <SelectContent>
          {currentOrganization && !organizations.some((item) => item.id === currentOrganization.id) && <SelectItem value={String(currentOrganization.id)}>{currentOrganization.name} (saat ini)</SelectItem>}
          {organizations.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name} ({item.unit_type})</SelectItem>)}
        </SelectContent>
      </Select>} />{fieldError("organization_unit_id")}
    </div>
    <label htmlFor="outlet-type">Jenis Outlet</label>
    <div><Controller control={form.control} name="outlet_type" render={({ field }) => <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
      <SelectTrigger id="outlet-type" className="w-full"><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="none">Tidak ditentukan</SelectItem>{OUTLET_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
      </SelectContent></Select>} />{fieldError("outlet_type")}</div>
    {([
      ["address", "Alamat", undefined, "text"], ["city", "Kota", 100, "text"], ["province", "Provinsi", 100, "text"],
      ["country", "Negara", 100, "text"], ["postal_code", "Kode pos", 20, "text"], ["phone", "Telepon", 50, "tel"],
      ["email", "Email", undefined, "email"], ["latitude", "Latitude (-90–90)", undefined, "text"], ["longitude", "Longitude (-180–180)", undefined, "text"],
      ["opening_date", "Tanggal buka", undefined, "date"], ["closing_date", "Tanggal tutup", undefined, "date"], ["manager_user_id", "Manager User ID", undefined, "text"],
    ] as const).map(([name, label, maxLength, type]) => <div key={name} className="contents"><label htmlFor={`outlet-${name}`}>{label}</label><div>
      <Input id={`outlet-${name}`} type={type} maxLength={maxLength} {...form.register(name)} />{fieldError(name)}
      {name === "manager_user_id" && <p className="text-sm text-muted-foreground">Opsional. Menunjuk User manager; tidak membuat assignment User ke Outlet.</p>}
    </div></div>)}
    <label htmlFor="outlet-status">Status</label>
    <div><Controller control={form.control} name="is_active" render={({ field }) => <Select value={field.value ? "active" : "inactive"} onValueChange={(value) => field.onChange(value === "active")}>
      <SelectTrigger id="outlet-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
    </Select>} />{fieldError("is_active")}</div>
    {(["operating_hours", "metadata"] as const).map((name) => <div key={name} className="contents"><label htmlFor={`outlet-${name}`}>{name === "operating_hours" ? "Jam operasional (JSON)" : "Metadata (JSON)"}</label><div>
      <textarea id={`outlet-${name}`} rows={4} className="w-full rounded-md border px-3 py-2 text-sm" {...form.register(name)} />{fieldError(name)}
      <p className="text-sm text-muted-foreground">Opsional, gunakan object/array JSON sesuai data backend.</p>
    </div></div>)}
  </>;
}
