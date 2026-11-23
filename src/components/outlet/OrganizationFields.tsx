"use client"

import { Controller } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OrganizationFormValues } from "@/validations/organizationUnitSchema"

export default function OrganizationFields({
  form,
  title,
  codeLocked,
  kindPicker,
  showFullName,
}: {
  form: UseFormReturn<OrganizationFormValues>;
  title: string;
  codeLocked?: boolean;
  kindPicker?: React.ReactNode;
  showFullName?: boolean;
}) {
  const error = (field: keyof OrganizationFormValues) => (
    <p
      id={`organization-${field}-error`}
      role="alert"
      className="text-xs text-red-600"
    >
      {form.formState.errors[field]?.message}
    </p>
  );
  return (
    <Card className="rounded-2xl bg-white py-6 shadow-lg">
      <CardContent className="space-y-4">
        {kindPicker ?? (
          <div>
            <label htmlFor="organization-kind" className="mb-1 block text-sm">
              Jenis
            </label>
            <Input id="organization-kind" value={title} disabled />
          </div>
        )}
        {(
          [
            ["code", "Kode", 50],
            ["name", "Nama", 255],
            ...(showFullName ? [["full_name", "Full Name", undefined] as const] : []),
            ["province", "Provinsi", 100],
            ["city", "Kota", 100],
            ["district", "Kecamatan", 100],
          ] as const
        ).map(([name, label, length]) => (
          <div key={name}>
            <label
              htmlFor={`organization-${name}`}
              className="mb-1 block text-sm"
            >
              {label}
              {(name === "code" || name === "name") && (
                <span className="text-red-600"> *</span>
              )}
            </label>
            <Input
              id={`organization-${name}`}
              maxLength={length}
              required={name === "code" || name === "name"}
              readOnly={name === "code" && codeLocked}
              aria-invalid={!!form.formState.errors[name]}
              aria-describedby={`organization-${name}-error`}
              {...form.register(name)}
            />
            {error(name)}
            {name === "code" && codeLocked && (
              <p className="text-xs text-muted-foreground">
                Kode tetap; perubahan kode menunggu perbaikan validasi backend.
              </p>
            )}
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Provinsi, Kota, dan Kecamatan diisi sebagai teks. Lookup lokasi belum tersedia.
        </p>
        <div>
          <label htmlFor="organization-status" className="mb-1 block text-sm">
            Status
          </label>
          <Controller
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <Select
                value={field.value ? "active" : "inactive"}
                onValueChange={(value) => field.onChange(value === "active")}
              >
                <SelectTrigger id="organization-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {error("is_active")}
        </div>
      </CardContent>
    </Card>
  );
}
