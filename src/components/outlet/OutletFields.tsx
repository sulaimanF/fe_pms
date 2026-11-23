"use client";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OUTLET_TYPES } from "@/types/outlet";
import type { OutletFormValues } from "@/validations/outletSchema";
import type { Outlet } from "@/types/outlet";
import OutletManagerSelect from "./OutletManagerSelect";
// Fields only. Each form owns its own initialization, draft and Save workflow.
export default function OutletFields({ form, currentManager }: {
    form: UseFormReturn<OutletFormValues>;
    currentManager?: Outlet["manager"];
}) {
    const error = (name: keyof OutletFormValues) => <p id={`outlet-${name}-error`} role="alert" className="text-xs text-red-600">{form.formState.errors[name]?.message}</p>;
    const input = (name: keyof Pick<OutletFormValues, "name" | "province" | "city">, label: string, length?: number) => <div key={name}>
    <label htmlFor={`outlet-${name}`} className="mb-1 block text-sm">{label}{name === "name" && <span className="text-red-600"> *</span>}</label>
    <Input id={`outlet-${name}`} maxLength={length} required={name === "name"} aria-invalid={!!form.formState.errors[name]} aria-describedby={`outlet-${name}-error`} {...form.register(name)}/>{error(name)}
  </div>;
    return <>
    {input("name", "Nama", 255)}
    {input("province", "Provinsi", 100)}
    {input("city", "Kota", 100)}
    <div><label htmlFor="outlet-district" className="mb-1 block text-sm">Kecamatan</label><Input id="outlet-district" maxLength={100} placeholder="Isi kecamatan" aria-invalid={!!form.formState.errors.district} aria-describedby="outlet-district-error" {...form.register("district")}/>{error("district")}</div>
    <p className="text-xs text-muted-foreground">Lokasi diisi sebagai teks. Lookup lokasi belum tersedia.</p>
    <div><label htmlFor="outlet-status" className="mb-1 block text-sm">Status</label>
      <Controller control={form.control} name="is_active" render={({ field }) => <Select value={field.value ? "active" : "inactive"} onValueChange={value => field.onChange(value === "active")}><SelectTrigger id="outlet-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>}/>{error("is_active")}
    </div>
      <div><label htmlFor="outlet-type" className="mb-1 block text-sm">Jenis layanan Outlet</label><Controller control={form.control} name="outlet_type" render={({ field }) => <Select value={field.value || "none"} onValueChange={value => field.onChange(value === "none" ? "" : value)}><SelectTrigger id="outlet-type" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Tidak ditentukan</SelectItem>{OUTLET_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>}/>{error("outlet_type")}</div>
      {([["address", "Alamat", undefined, "text"], ["country", "Negara", 100, "text"], ["postal_code", "Kode pos", 20, "text"], ["phone", "Telepon", 50, "tel"], ["email", "Email", undefined, "email"], ["opening_date", "Tanggal buka", undefined, "date"], ["closing_date", "Tanggal tutup", undefined, "date"]] as const).map(([name, label, maxLength, type]) => <div key={name}><label htmlFor={`outlet-${name}`} className="mb-1 block text-sm">{label}</label><Input id={`outlet-${name}`} type={type} maxLength={maxLength} {...form.register(name)}/>{error(name)}</div>)}
      <OutletManagerSelect form={form} currentManager={currentManager}/>
  </>;
}
