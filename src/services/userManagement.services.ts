import axios from "axios";
import api from "@/lib/axios";
import { assertEntityResponse, collectPages, isValidEntityId } from "@/lib/managementApi";
import { sameAssignmentIds } from "@/lib/managementForm";
import type { ApiResponse } from "@/types/common";
import type { UserCreateRequest, UserUpdateRequest, UserResponse, UserDetailResponse, UserWriteResponse } from "@/types/userManagement";

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

export const getUsers = async (page?: number) => (await api.get<UserResponse>("/users", { params: page ? { page, per_page: 100 } : undefined })).data;
export const getAllUsers = () => collectPages(getUsers);
export const getUserById = async (id: number) => assertEntityResponse((await api.get<UserDetailResponse>("/users/" + id)).data);
export const createUser = async (payload: UserCreateRequest) => assertAtomicUserWrite((await api.post<UserWriteResponse>("/users", payload)).data, payload);
export const updateUser = async (id: number, payload: UserUpdateRequest) => assertAtomicUserWrite((await api.put<UserWriteResponse>("/users/" + id, payload)).data, payload, id);
export const assignUserRoles = async (id: number, roleIds: number[]) => assertEntityResponse((await api.post<UserWriteResponse>("/users/" + id + "/roles", { role_ids: roleIds })).data);
