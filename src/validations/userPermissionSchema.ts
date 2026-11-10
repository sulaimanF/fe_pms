import { z } from "zod";
import type { UserPermissionCreateRequest, UserPermissionUpdateRequest, UserPermissionOverride } from "@/types/userManagement";

// Backend uses Asia/Jakarta. A datetime-local input must not use the browser's timezone.
export function normalizeUserPermissionExpiry(value: string | null): string | null {
  if (!value) return null;
  const local = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?$/.exec(value);
  if (local) {
    const result = `${local[1]} ${local[2]}:${local[3] ?? "00"}`;
    const date = new Date(result.replace(" ", "T") + "+07:00");
    if (!Number.isFinite(date.getTime()) || new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 19).replace("T", " ") !== result) throw new Error("Tanggal expiry tidak valid.");
    return result;
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error("Format expiry tidak valid.");
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Tanggal expiry tidak valid.");
  return new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 19).replace("T", " ");
}

const expiry = z.string().nullable().refine((value) => {
  try { normalizeUserPermissionExpiry(value); return true; } catch { return false; }
}, "Tanggal expiry tidak valid.");
const futureExpiry = expiry.refine((value) => {
  try { return !value || new Date(normalizeUserPermissionExpiry(value)!.replace(" ", "T") + "+07:00").getTime() > Date.now(); }
  catch { return false; }
}, "Expiry baru harus di masa depan (WIB).");
const entityId = z.number().int().positive().refine(Number.isSafeInteger);
export const userPermissionCreateRequestSchema = z.object({
  permission_id: entityId,
  granted: z.boolean(),
  reason: z.string().max(1000).nullable(),
  expires_at: futureExpiry.transform(normalizeUserPermissionExpiry),
});
export const userPermissionUpdateRequestSchema = userPermissionCreateRequestSchema.omit({ permission_id: true }).partial();
export const userPermissionSchema = z.object({
  permission_id: z.string().regex(/^[1-9]\d*$/, "Pilih permission.").refine((value) => Number.isSafeInteger(Number(value)), "ID permission tidak valid."),
  granted: z.boolean(),
  reason: z.string().trim().max(1000, "Alasan maksimal 1000 karakter."),
  // Existing expired values are allowed here; only a newly assigned expiry must be future.
  expires_at: z.string().refine((value) => {
    try { normalizeUserPermissionExpiry(value); return true; } catch { return false; }
  }, "Tanggal expiry tidak valid."),
});
export type UserPermissionFormValues = z.infer<typeof userPermissionSchema>;
export const emptyUserPermission: UserPermissionFormValues = { permission_id: "", granted: true, reason: "", expires_at: "" };
export function userPermissionToForm(row: UserPermissionOverride): UserPermissionFormValues {
  return { permission_id: String(row.permission_id), granted: row.granted, reason: row.reason ?? "", expires_at: normalizeUserPermissionExpiry(row.expires_at)?.replace(" ", "T") ?? "" };
}
export function buildUserPermissionCreate(values: UserPermissionFormValues): UserPermissionCreateRequest {
  return userPermissionCreateRequestSchema.parse({ permission_id: Number(values.permission_id), granted: values.granted, reason: values.reason.trim() || null, expires_at: normalizeUserPermissionExpiry(values.expires_at) });
}
export function buildUserPermissionUpdate(values: UserPermissionFormValues, before: UserPermissionOverride): UserPermissionUpdateRequest {
  const payload: UserPermissionUpdateRequest = {};
  if (Number(values.permission_id) !== before.permission_id) throw new Error("Permission pada override existing tidak dapat diganti.");
  if (values.granted !== before.granted) payload.granted = values.granted;
  const reason = values.reason.trim() || null;
  if (reason !== before.reason) payload.reason = reason;
  const expiresAt = normalizeUserPermissionExpiry(values.expires_at);
  if (expiresAt !== normalizeUserPermissionExpiry(before.expires_at)) payload.expires_at = expiresAt;
  return userPermissionUpdateRequestSchema.parse(payload);
}
export function userPermissionMatches(row: UserPermissionOverride, expected: UserPermissionUpdateRequest): boolean {
  return (expected.granted === undefined || row.granted === expected.granted) &&
    (expected.reason === undefined || row.reason === expected.reason) &&
    (expected.expires_at === undefined || normalizeUserPermissionExpiry(row.expires_at) === normalizeUserPermissionExpiry(expected.expires_at));
}
