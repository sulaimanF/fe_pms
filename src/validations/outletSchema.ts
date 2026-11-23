import { z } from "zod";
import { OUTLET_TYPES } from "@/types/outlet";
import type {
  Outlet,
  OutletCreateRequest,
  OutletUpdateRequest,
} from "@/types/outlet";

const id = z
  .string()
  .refine(
    (value) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)),
    "ID organisasi tidak valid.",
  );

const optionalId = z
  .string()
  .refine(
    (value) =>
      value === "" ||
      (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))),
    "ID User tidak valid.",
  );

const date = z
  .string()
  .refine(
    (value) =>
      value === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        Number.isFinite(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value),
    "Tanggal tidak valid.",
  );

const fields = {
  code: z.string().trim().min(1, "Kode wajib diisi.").max(50),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(255),
  organization_unit_id: id,
  outlet_type: z.union([z.enum(OUTLET_TYPES), z.literal("")]),
  address: z.string().trim(),
  city: z.string().trim().max(100),
  province: z.string().trim().max(100),
  district: z.string().trim().max(100, "Kecamatan maksimal 100 karakter."),
  country: z.string().trim().max(100),
  postal_code: z.string().trim().max(20),
  phone: z.string().trim().max(50),
  email: z.union([z.email("Email tidak valid."), z.literal("")]),
  opening_date: date,
  closing_date: date,
  manager_user_id: optionalId,
  is_active: z.boolean(),
};

const dateOrder = (
  value: { opening_date: string; closing_date: string },
  context: z.RefinementCtx,
) => {
  if (
    value.opening_date &&
    value.closing_date &&
    value.closing_date < value.opening_date
  )
    context.addIssue({
      code: "custom",
      path: ["closing_date"],
      message: "Tanggal tutup tidak boleh sebelum tanggal buka.",
    });
};

export const createOutletSchema = z.object(fields).superRefine(dateOrder);

export const updateOutletSchema = z
  .object({
    ...fields,
    country: fields.country.min(
      1,
      "Negara tidak dapat dikosongkan karena kolom backend tidak menerima null.",
    ),
  })
  .superRefine(dateOrder);

export type OutletFormValues = z.infer<typeof createOutletSchema>;

export const emptyOutlet: OutletFormValues = {
  code: "",
  name: "",
  organization_unit_id: "",
  outlet_type: "",
  address: "",
  city: "",
  province: "",
  district: "",
  country: "",
  postal_code: "",
  phone: "",
  email: "",
  opening_date: "",
  closing_date: "",
  manager_user_id: "",
  is_active: true,
};

export function outletToForm(outlet: Outlet): OutletFormValues {
  return {
    code: outlet.code,
    name: outlet.name,
    organization_unit_id: String(outlet.organization_unit_id),
    outlet_type: outlet.outlet_type ?? "",
    address: outlet.address ?? "",
    city: outlet.city ?? "",
    province: outlet.province ?? "",
    district: outlet.district ?? "",
    country: outlet.country,
    postal_code: outlet.postal_code ?? "",
    phone: outlet.phone ?? "",
    email: outlet.email ?? "",
    opening_date: outlet.opening_date?.slice(0, 10) ?? "",
    closing_date: outlet.closing_date?.slice(0, 10) ?? "",
    manager_user_id:
      outlet.manager_user_id === null ? "" : String(outlet.manager_user_id),
    is_active: outlet.is_active,
  };
}

function outletPayload(values: OutletFormValues): OutletCreateRequest {
  return {
    code: values.code,
    name: values.name,
    organization_unit_id: Number(values.organization_unit_id),
    outlet_type: values.outlet_type || null,
    address: values.address || null,
    city: values.city || null,
    province: values.province || null,
    district: values.district || null,
    ...(values.country ? { country: values.country } : {}),
    postal_code: values.postal_code || null,
    phone: values.phone || null,
    email: values.email || null,
    opening_date: values.opening_date || null,
    closing_date: values.closing_date || null,
    manager_user_id:
      values.manager_user_id === "" ? null : Number(values.manager_user_id),
    is_active: values.is_active,
  };
}

export const buildOutletCreate = (values: OutletFormValues) => outletPayload(values);

export function buildOutletUpdate(
  values: OutletFormValues,
  dirty: Partial<Record<keyof OutletFormValues, unknown>>,
): OutletUpdateRequest {
  if (dirty.code)
    throw new Error(
      "Perubahan kode Outlet belum tersedia sampai validasi unique backend diperbaiki.",
    );
  if (dirty.country && !values.country)
    throw new Error("Negara tidak dapat dikosongkan.");
  const all = outletPayload(values),
    payload: OutletUpdateRequest = {};
  for (const key of Object.keys(dirty) as (keyof OutletFormValues)[]) {
    if (dirty[key] && key !== "code" && Object.prototype.hasOwnProperty.call(all, key))
      Object.assign(payload, { [key]: all[key] });
  }
  return payload;
}

export const outletEditableFields = Object.keys(
  fields,
) as (keyof OutletFormValues)[];
