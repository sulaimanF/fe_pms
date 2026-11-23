import { z } from "zod";
import type { ManagedOrganizationType, OrganizationCreateRequest, OrganizationUnit, OrganizationWriteRequest } from "@/types/organizationUnit";
const fields = {
    code: z.string().trim().min(1, "Kode wajib diisi.").max(50),
    name: z.string().trim().min(1, "Nama wajib diisi.").max(255),
    full_name: z.string().trim(),
    province: z.string().trim().max(100),
    city: z.string().trim().max(100),
    district: z.string().trim().max(100, "Kecamatan maksimal 100 karakter."),
    is_active: z.boolean(),
};
export const createOrganizationSchema = z.object(fields);
export const updateOrganizationSchema = z.object(fields);
export type OrganizationFormValues = z.infer<typeof createOrganizationSchema>;
export const emptyOrganization: OrganizationFormValues = { code: "", name: "", full_name: "", province: "", city: "", district: "", is_active: true };
export function organizationToForm(unit: OrganizationUnit): OrganizationFormValues {
    return { code: unit.code, name: unit.name, full_name: unit.full_name ?? "", province: unit.province ?? "", city: unit.city ?? "", district: unit.district ?? "", is_active: unit.is_active };
}
export function buildOrganizationCreate(values: OrganizationFormValues, type: ManagedOrganizationType, parentId: number | null): OrganizationCreateRequest {
    return { code: values.code, name: values.name, full_name: values.full_name || null, unit_type: type, parent_id: parentId, province: values.province || null, city: values.city || null, district: values.district || null, is_active: values.is_active };
}
export function buildOrganizationUpdate(values: OrganizationFormValues, dirty: Partial<Record<keyof OrganizationFormValues, unknown>>, parentId: number | null, baselineParent: number | null, type: OrganizationUnit["unit_type"]): OrganizationWriteRequest {
    if (dirty.code)
        throw new Error("Perubahan kode belum tersedia sampai validasi unique backend diperbaiki.");
    const payload: OrganizationWriteRequest = {};
    if (dirty.name)
        payload.name = values.name;
    if ((type === "wilayah" || type === "cabang") && dirty.full_name)
        payload.full_name = values.full_name || null;
    if (dirty.province)
        payload.province = values.province || null;
    if (dirty.city)
        payload.city = values.city || null;
    if (dirty.district)
        payload.district = values.district || null;
    if (dirty.is_active)
        payload.is_active = values.is_active;
    if (parentId !== baselineParent)
        payload.parent_id = parentId;
    return payload;
}
