import axios from "axios";
import api from "@/lib/axios";
import { assertEntityResponse, collectPages, isValidEntityId } from "@/lib/managementApi";
import { sameAssignmentIds } from "@/lib/managementForm";
import type { ApiResponse } from "@/types/common";
import type { UserCreateRequest, UserUpdateRequest, UserResponse, UserDetailResponse, UserWriteResponse, UserDeleteResponse } from "@/types/userManagement";
import type { UserPermissionOverride, UserPermissionsResponse, UserPermissionResponse, UserPermissionCreateRequest, UserPermissionUpdateRequest } from "@/types/userManagement";
import { normalizeUserPermissionExpiry, userPermissionMatches } from "@/validations/userPermissionSchema";

// The backend changes supplied with this task must be installed before writing.
export const USER_WRITE_CONTRACT = "user-assignments-v1";
export class UserWriteContractError extends Error {
  constructor(public readonly mayHaveSaved = false, public readonly entityId?: number) {
    super(mayHaveSaved ?
      "Respons server belum mengonfirmasi penyimpanan User, role, dan outlet secara terpadu. Periksa data sebelum mengulang penyimpanan." :
      "Penyimpanan User beserta assignment belum tersedia pada server. Hubungi administrator; data belum dikirim.");
    this.name = "UserWriteContractError";
  }
}

// Contains no Axios config, request body, or credentials. Only actual write failures use this.
export class UserWriteUncertainError extends Error {
  constructor(public readonly entityId?: number) {
    super("Hasil penyimpanan belum dapat dipastikan. Periksa hasil sebelum mengirim penyimpanan baru.");
    this.name = "UserWriteUncertainError";
  }
}

export async function verifyUserWriteContract() {
  try {
    const response = (await api.get<ApiResponse<{ contract: string }>>("/users/write-contract")).data;
    if (response?.success !== true || response.data?.contract !== USER_WRITE_CONTRACT) throw new UserWriteContractError();
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) throw new UserWriteContractError();
    throw error;
  }
}

function assignmentIds(items: unknown, kind: "roles" | "outlets"): number[] | null {
  if (!Array.isArray(items)) return null;
  const ids: number[] = [];
  const entries: readonly unknown[] = items;
  for (const item of entries) {
    if (!item || typeof item !== "object" || !("id" in item) || !isValidEntityId(item.id)) return null;
    const pivot: unknown = "pivot" in item ? item.pivot : undefined;
    if (pivot && typeof pivot === "object") {
      if (kind === "outlets" && "revoked_at" in pivot && pivot.revoked_at != null) continue;
      if (kind === "roles" && "is_active" in pivot && pivot.is_active === false) continue;
    }
    ids.push(item.id);
  }
  return ids;
}

function assertAtomicUserWrite(response: UserWriteResponse, payload: UserUpdateRequest, expectedId?: number) {
  const entity = response?.data, meta = response?.meta;
  const id = isValidEntityId(entity?.id) ? entity.id : undefined;
  const roles = assignmentIds(entity?.roles, "roles");
  const outlets = assignmentIds(entity?.outlets, "outlets");
  if (response?.success !== true || !id || (expectedId !== undefined && id !== expectedId) ||
    !meta || typeof meta !== "object" || !("user_write_contract" in meta) || meta.user_write_contract !== USER_WRITE_CONTRACT ||
    roles === null || outlets === null ||
    (payload.role_ids !== undefined && !sameAssignmentIds(payload.role_ids, roles)) ||
    (payload.outlet_ids !== undefined && !sameAssignmentIds(payload.outlet_ids, outlets))) {
    throw new UserWriteContractError(true, id);
  }
  return response;
}

export const getUsers = async (page?: number, signal?: AbortSignal) => (await api.get<UserResponse>("/users", { params: page ? { page, per_page: 100 } : undefined, signal })).data;
export const getAllUsers = (signal?: AbortSignal) => collectPages((page) => getUsers(page, signal));
export const getUserById = async (id: number, signal?: AbortSignal) => assertEntityResponse((await api.get<UserDetailResponse>("/users/" + id, { signal })).data);
async function writeUser(payload: UserUpdateRequest, id?: number) {
  try {
    const response = id === undefined
      ? await api.post<UserWriteResponse>("/users", payload)
      : await api.put<UserWriteResponse>("/users/" + id, payload);
    if (response.status !== (id === undefined ? 201 : 200)) throw new UserWriteUncertainError();
    return assertAtomicUserWrite(response.data, payload, id);
  } catch (error: unknown) {
    if (error instanceof UserWriteUncertainError) throw error;
    if (error instanceof UserWriteContractError && error.mayHaveSaved) throw new UserWriteUncertainError(error.entityId);
    // Only known request rejections prove that this write was refused. Other failures,
    // including response decoding failures, may follow a committed transaction.
    if (axios.isAxiosError(error) && error.response &&
      [400, 401, 403, 404, 405, 409, 415, 422, 429].includes(error.response.status)) throw error;
    throw new UserWriteUncertainError();
  }
}
export const createUser = (payload: UserCreateRequest) => writeUser(payload);
export const updateUser = (id: number, payload: UserUpdateRequest) => writeUser(payload, id);
export class UserDeleteResponseError extends Error {
  constructor() {
    super("Server belum mengonfirmasi penghapusan user. Periksa daftar sebelum mencoba lagi.");
    this.name = "UserDeleteResponseError";
  }
}
export const deleteUser = async (id: number): Promise<UserDeleteResponse> => {
  if (!isValidEntityId(id)) throw new Error("ID user tidak valid.");
  const response = await api.delete<UserDeleteResponse>("/users/" + id);
  if (response.status !== 200 || response.data?.success !== true || response.data.http_code !== 200 || response.data.data !== null) {
    throw new UserDeleteResponseError();
  }
  return response.data;
};
export const assignUserRoles = async (id: number, roleIds: number[]) => assertEntityResponse((await api.post<UserWriteResponse>("/users/" + id + "/roles", { role_ids: roleIds })).data);

export class UserPermissionResponseError extends Error {
  constructor(public readonly mayHaveSaved = false) {
    super("Respons permission khusus belum dapat diverifikasi. Muat ulang hasil sebelum mengulang operasi.");
    this.name = "UserPermissionResponseError";
  }
}
function assertPermissionIds(...ids: number[]) {
  if (ids.some((id) => !isValidEntityId(id))) throw new Error("ID user/permission tidak valid.");
}
function readUserPermission(value: unknown, mayHaveSaved: boolean): UserPermissionOverride {
  if (!value || typeof value !== "object") throw new UserPermissionResponseError(mayHaveSaved);
  const row = value as Partial<UserPermissionOverride>;
  if (!isValidEntityId(row.permission_id) || typeof row.granted !== "boolean" || typeof row.is_active !== "boolean" ||
    typeof row.code !== "string" || typeof row.module !== "string" || typeof row.resource !== "string" || typeof row.action !== "string" ||
    (row.reason !== null && typeof row.reason !== "string") || typeof row.granted_at !== "string" ||
    (row.granted_by !== null && !isValidEntityId(row.granted_by)) || (row.expires_at !== null && typeof row.expires_at !== "string")) throw new UserPermissionResponseError(mayHaveSaved);
  try { return { ...row, expires_at: normalizeUserPermissionExpiry(row.expires_at) } as UserPermissionOverride; }
  catch { throw new UserPermissionResponseError(mayHaveSaved); }
}
export async function getUserPermissions(userId: number, signal?: AbortSignal): Promise<UserPermissionsResponse> {
  assertPermissionIds(userId);
  const response = await api.get<UserPermissionsResponse>(`/users/${userId}/permissions`, { signal });
  if (response.status !== 200 || response.data?.success !== true || response.data.http_code !== 200 || !Array.isArray(response.data.data)) throw new UserPermissionResponseError();
  const rows = response.data.data.map((row: unknown) => readUserPermission(row, false));
  if (new Set(rows.map((row) => row.permission_id)).size !== rows.length) throw new UserPermissionResponseError();
  return { ...response.data, data: rows };
}
export async function createUserPermission(userId: number, payload: UserPermissionCreateRequest): Promise<UserPermissionResponse> {
  assertPermissionIds(userId, payload.permission_id);
  const response = await api.post<UserPermissionResponse>(`/users/${userId}/permissions`, payload);
  const row = readUserPermission(response.data?.data, true);
  if (response.status !== 201 || response.data?.success !== true || response.data.http_code !== 201 || row.permission_id !== payload.permission_id || !userPermissionMatches(row, payload)) throw new UserPermissionResponseError(true);
  return { ...response.data, data: row };
}
export async function updateUserPermission(userId: number, permissionId: number, payload: UserPermissionUpdateRequest): Promise<UserPermissionResponse> {
  assertPermissionIds(userId, permissionId);
  const response = await api.put<UserPermissionResponse>(`/users/${userId}/permissions/${permissionId}`, payload);
  const row = readUserPermission(response.data?.data, true);
  if (response.status !== 200 || response.data?.success !== true || response.data.http_code !== 200 || row.permission_id !== permissionId || !userPermissionMatches(row, payload)) throw new UserPermissionResponseError(true);
  return { ...response.data, data: row };
}
export async function deleteUserPermission(userId: number, permissionId: number): Promise<ApiResponse<null>> {
  assertPermissionIds(userId, permissionId);
  const response = await api.delete<ApiResponse<null>>(`/users/${userId}/permissions/${permissionId}`);
  if (response.status !== 200 || response.data?.success !== true || response.data.http_code !== 200 || response.data.data !== null) throw new UserPermissionResponseError(true);
  return response.data;
}
