import { sameAssignmentIds } from "@/lib/managementForm";
import { getUnrevokedUserOutlets } from "@/lib/userAssignments";
import type { UserManagement, UserUpdateRequest } from "@/types/userManagement";

const readableFields = ["username", "email", "full_name", "display_name", "phone", "organization_unit_id", "is_active", "is_bypass"] as const;
type ReadableField = typeof readableFields[number];
type ExpectedUser = Pick<UserUpdateRequest, ReadableField | "role_ids" | "outlet_ids">;

export interface UserWriteAttempt {
  readonly kind: "create" | "update";
  readonly id?: number;
  readonly expected: Readonly<ExpectedUser>;
  readonly passwordRequested: boolean;
}

// Keep only readable fields in component memory. Never retain a password in the recovery snapshot.
export function snapshotUserWrite(kind: UserWriteAttempt["kind"], payload: UserUpdateRequest, id?: number): UserWriteAttempt {
  const expected: ExpectedUser = {};
  for (const key of readableFields) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) Object.assign(expected, { [key]: payload[key] });
  }
  if (payload.role_ids !== undefined) expected.role_ids = [...payload.role_ids];
  if (payload.outlet_ids !== undefined) expected.outlet_ids = [...payload.outlet_ids];
  Object.freeze(expected.role_ids);
  Object.freeze(expected.outlet_ids);
  return Object.freeze({ kind, id, expected: Object.freeze(expected), passwordRequested: !!payload.password });
}

export function compareUserWrite(user: UserManagement, attempt: UserWriteAttempt) {
  const different: string[] = [], unavailable: string[] = [];
  for (const key of readableFields) {
    if (!Object.prototype.hasOwnProperty.call(attempt.expected, key)) continue;
    if (!Object.prototype.hasOwnProperty.call(user, key) || user[key] === undefined) unavailable.push(key);
    else if (user[key] !== attempt.expected[key]) different.push(key);
  }
  if (attempt.expected.role_ids !== undefined) {
    if (!Array.isArray(user.roles)) unavailable.push("role_ids");
    else if (!sameAssignmentIds(attempt.expected.role_ids, user.roles.filter((role) => role.pivot?.is_active !== false).map((role) => role.id))) different.push("role_ids");
  }
  if (attempt.expected.outlet_ids !== undefined) {
    if (!Array.isArray(user.outlets)) unavailable.push("outlet_ids");
    else if (!sameAssignmentIds(attempt.expected.outlet_ids, getUnrevokedUserOutlets(user.outlets).map((outlet) => outlet.id))) different.push("outlet_ids");
  }
  return { different, unavailable };
}

export function describeUserWriteCheck(user: UserManagement, attempt: UserWriteAttempt) {
  const { different, unavailable } = compareUserWrite(user, attempt);
  const observation = different.length
    ? `Data terbaca belum sesuai snapshot percobaan (${different.join(", ")}).`
    : "Field yang dapat dibaca sesuai snapshot percobaan, termasuk assignment yang dikirim.";
  return `${observation}${unavailable.length ? ` Field tidak tersedia untuk diperiksa: ${unavailable.join(", ")}.` : ""}` +
    (attempt.kind === "create" ? " Kecocokan ini belum membuktikan akun berasal dari percobaan create tersebut." : " Pembacaan ini menunjukkan kondisi saat ini, bukan konfirmasi bahwa request sebelumnya selesai.") +
    (attempt.passwordRequested ? " Perubahan password tidak dapat dipastikan melalui endpoint baca." : "") +
    " Tidak ada penyimpanan atau assignment yang diulang. Hasil operasi masih belum pasti.";
}
