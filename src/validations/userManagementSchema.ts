import { z } from "zod";
import type { UserCreateRequest, UserUpdateRequest } from "@/types/userManagement";

const fields = {
  code: z.string().trim().max(50),
  username: z.string().trim().min(1, "Login ID wajib diisi.").max(100),
  email: z.string().trim().email("Email tidak valid.").max(255),
  full_name: z.string().trim().min(1, "Nama lengkap wajib diisi.").max(255),
  display_name: z.string().trim().max(255, "Display Name maksimal 255 karakter."),
  phone: z.string().trim().max(50, "Phone maksimal 50 karakter."),
  password: z.string(), password_confirmation: z.string(),
  organization_unit_id: z.string().refine((v) => v === "" || (/^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v))), "ID organisasi tidak valid."),
  is_active: z.boolean(), role_ids: z.array(z.number().int().positive()),
  outlet_ids: z.array(z.number().int().positive()),
};

export const createUserSchema = z.object(fields).superRefine((value, context) => {
  if (value.password.length < 8) context.addIssue({ code: "custom", path: ["password"], message: "Password minimal 8 karakter." });
  if (value.password !== value.password_confirmation) context.addIssue({ code: "custom", path: ["password_confirmation"], message: "Konfirmasi password tidak sama." });
  if (!value.password && value.password_confirmation) context.addIssue({ code: "custom", path: ["password_confirmation"], message: "Isi password baru terlebih dahulu." });
});

export const updateUserSchema = z.object(fields).superRefine((value, context) => {
  if (value.password !== "" && value.password.length < 8) context.addIssue({ code: "custom", path: ["password"], message: "Password minimal 8 karakter." });
  if (value.password !== "" && value.password !== value.password_confirmation) context.addIssue({ code: "custom", path: ["password_confirmation"], message: "Konfirmasi password tidak sama." });
  if (!value.password && value.password_confirmation) context.addIssue({ code: "custom", path: ["password_confirmation"], message: "Isi password baru terlebih dahulu." });
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export function buildUserCreate(values: CreateUserFormValues): UserCreateRequest {
  return {
    username: values.username,
    email: values.email,
    full_name: values.full_name,
    display_name: values.display_name || null,
    phone: values.phone || null,
    password: values.password,
    password_confirmation: values.password_confirmation,
    ...(values.code ? { code: values.code } : {}),
    organization_unit_id: values.organization_unit_id ? Number(values.organization_unit_id) : null,
    is_active: values.is_active,
    role_ids: values.role_ids,
    outlet_ids: values.outlet_ids,
  };
}

export function buildUserUpdate(values: UpdateUserFormValues, dirty: Partial<Record<keyof UpdateUserFormValues, unknown>>): UserUpdateRequest {
  const payload: UserUpdateRequest = {};
  if (dirty.username) payload.username = values.username;
  if (dirty.email) payload.email = values.email;
  if (dirty.full_name) payload.full_name = values.full_name;
  if (dirty.display_name) payload.display_name = values.display_name || null;
  if (dirty.phone) payload.phone = values.phone || null;
  if (dirty.organization_unit_id) payload.organization_unit_id = values.organization_unit_id ? Number(values.organization_unit_id) : null;
  if (dirty.is_active) payload.is_active = values.is_active;
  if (dirty.role_ids) payload.role_ids = values.role_ids;
  if (dirty.outlet_ids) payload.outlet_ids = values.outlet_ids;
  if (values.password !== "") { payload.password = values.password; payload.password_confirmation = values.password_confirmation; }
  return payload;
}
