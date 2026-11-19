import { z } from "zod";
import { OUTLET_TYPES } from "@/types/outlet";
import type {
  Outlet,
  OutletCreateRequest,
  OutletJsonContainer,
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

const coordinate = (limit: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit),
      `Koordinat harus berada pada rentang -${limit} sampai ${limit}.`,
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

function jsonContainer(text: string): OutletJsonContainer | null {
  if (!text.trim()) return null;
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object")
    throw new Error("Gunakan object atau array JSON.");
  return value as OutletJsonContainer;
}

const json = z.string().refine((value) => {
  try {
    jsonContainer(value);
    return true;
  } catch {
    return false;
  }
}, "Gunakan object/array JSON yang valid, atau kosongkan.");

const fields = {
  code: z.string().trim().min(1, "Kode wajib diisi.").max(50),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(255),
  organization_unit_id: id,
  outlet_type: z.union([z.enum(OUTLET_TYPES), z.literal("")]),
  address: z.string().trim(),
  city: z.string().trim().max(100),
  province: z.string().trim().max(100),
  country: z.string().trim().max(100),
  postal_code: z.string().trim().max(20),
  phone: z.string().trim().max(50),
  email: z.union([z.email("Email tidak valid."), z.literal("")]),
  latitude: coordinate(90),
  longitude: coordinate(180),
  opening_date: date,
  closing_date: date,
  manager_user_id: optionalId,
  is_active: z.boolean(),
  operating_hours: json,
  metadata: json,
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
  country: "",
  postal_code: "",
  phone: "",
  email: "",
  latitude: "",
  longitude: "",
  opening_date: "",
  closing_date: "",
  manager_user_id: "",
  is_active: true,
  operating_hours: "",
  metadata: "",
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
    country: outlet.country,
    postal_code: outlet.postal_code ?? "",
    phone: outlet.phone ?? "",
    email: outlet.email ?? "",
    latitude: outlet.latitude ?? "",
    longitude: outlet.longitude ?? "",
    opening_date: outlet.opening_date?.slice(0, 10) ?? "",
    closing_date: outlet.closing_date?.slice(0, 10) ?? "",
    manager_user_id:
      outlet.manager_user_id === null ? "" : String(outlet.manager_user_id),
    is_active: outlet.is_active,
    operating_hours:
      outlet.operating_hours === null
        ? ""
        : JSON.stringify(outlet.operating_hours, null, 2),
    metadata:
      outlet.metadata === null ? "" : JSON.stringify(outlet.metadata, null, 2),
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
    ...(values.country ? { country: values.country } : {}),
    postal_code: values.postal_code || null,
    phone: values.phone || null,
    email: values.email || null,
    latitude: values.latitude === "" ? null : Number(values.latitude),
    longitude: values.longitude === "" ? null : Number(values.longitude),
    opening_date: values.opening_date || null,
    closing_date: values.closing_date || null,
    manager_user_id:
      values.manager_user_id === "" ? null : Number(values.manager_user_id),
    is_active: values.is_active,
    operating_hours: jsonContainer(values.operating_hours),
    metadata: jsonContainer(values.metadata),
  };
}

export const buildOutletCreate = (values: OutletFormValues) =>
  outletPayload(values);

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
    if (dirty[key] && key !== "code")
      Object.assign(payload, { [key]: all[key] });
  }
  return payload;
}

export const outletEditableFields = Object.keys(
  fields,
) as (keyof OutletFormValues)[];
