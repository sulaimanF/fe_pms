import { z } from "zod";
import type { ManagedOrganizationType, OrganizationCreateRequest, OrganizationUnit, OrganizationWriteRequest } from "@/types/organizationUnit";
const fields = {
    code: z.string().trim().min(1, "Kode wajib diisi.").max(50),
    name: z.string().trim().min(1, "Nama wajib diisi.").max(255),
    province: z.string().trim().max(100),
    city: z.string().trim().max(100),
    is_active: z.boolean(),
};
export const createOrganizationSchema = z.object(fields);
export const updateOrganizationSchema = z.object(fields);
export type OrganizationFormValues = z.infer<typeof createOrganizationSchema>;
export const emptyOrganization: OrganizationFormValues = { code: "", name: "", province: "", city: "", is_active: true };
export function organizationToForm(unit: OrganizationUnit): OrganizationFormValues {
    return { code: unit.code, name: unit.name, province: unit.province ?? "", city: unit.city ?? "", is_active: unit.is_active };
}
export function buildOrganizationCreate(values: OrganizationFormValues, type: ManagedOrganizationType, parentId: number | null): OrganizationCreateRequest {
    return { code: values.code, name: values.name, unit_type: type, parent_id: parentId, province: values.province || null, city: values.city || null, is_active: values.is_active };
}
export function buildOrganizationUpdate(values: OrganizationFormValues, dirty: Partial<Record<keyof OrganizationFormValues, unknown>>, parentId: number | null, baselineParent: number | null): OrganizationWriteRequest {
    if (dirty.code)
        throw new Error("Perubahan kode belum tersedia sampai validasi unique backend diperbaiki.");
    const payload: OrganizationWriteRequest = {};
    if (dirty.name)
        payload.name = values.name;
    if (dirty.province)
        payload.province = values.province || null;
    if (dirty.city)
        payload.city = values.city || null;
    if (dirty.is_active)
        payload.is_active = values.is_active;
    if (parentId !== baselineParent)
        payload.parent_id = parentId;
    return payload;
}
