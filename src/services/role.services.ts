import api from "@/lib/axios";
import { assertApiSuccess, assertEntityResponse, collectPages, isValidEntityId } from "@/lib/managementApi";
import { sameAssignmentIds } from "@/lib/managementForm";
import type { RoleCreateRequest, RoleUpdateRequest, RoleListResponse, RoleDetailResponse, RoleWriteResponse, RoleDeleteResponse, RoleMenusResponse } from "@/types/role";

export class RoleWriteResponseError extends Error {
  constructor(public readonly entityId?: number) {
    super("Hasil penyimpanan role belum dapat dikonfirmasi. Periksa data sebelum mengulang penyimpanan.");
    this.name = "RoleWriteResponseError";
  }
}
function assertRoleWrite(response: RoleWriteResponse, payload: RoleUpdateRequest, expectedId?: number) {
  const id = isValidEntityId(response?.data?.id) ? response.data.id : undefined;
  try { assertEntityResponse(response); } catch { throw new RoleWriteResponseError(id); }
  if ((expectedId !== undefined && id !== expectedId) ||
    (payload.code !== undefined && response.data.code !== payload.code) ||
    (payload.name !== undefined && response.data.name !== payload.name) ||
    (payload.description !== undefined && response.data.description !== payload.description)) {
    throw new RoleWriteResponseError(id);
  }
  return response;
}
function assertAssignment(items: unknown, expected: number[], id: number) {
  if (!Array.isArray(items) || items.some((item: unknown) => !item || typeof item !== "object" ||
    !("id" in item) || !isValidEntityId(item.id)) || !sameAssignmentIds(expected, items.map((item: { id: number }) => item.id))) {
    throw new RoleWriteResponseError(id);
  }
}

export const getRoles = async (page?: number) => (await api.get<RoleListResponse>("/roles", { params: page ? { page, per_page: 100 } : undefined })).data;
export const getAllRoles = () => collectPages(getRoles);
export const getRoleById = async (id: number | string) => assertEntityResponse((await api.get<RoleDetailResponse>(`/roles/${id}`)).data);
export const createRole = async (payload: RoleCreateRequest) => assertRoleWrite((await api.post<RoleWriteResponse>("/roles", payload)).data, payload);
export const updateRole = async (id: number, payload: RoleUpdateRequest) => assertRoleWrite((await api.put<RoleWriteResponse>(`/roles/${id}`, payload)).data, payload, id);
export const syncRolePermissions = async (id: number, permissionIds: number[]) => {
  const response = assertRoleWrite((await api.post<RoleWriteResponse>(`/roles/${id}/permissions/sync`, { permission_ids: permissionIds })).data, {}, id);
  assertAssignment(response.data.permissions, permissionIds, id);
  return response;
};
export const getRoleMenus = async (id: number) => {
  const response = assertApiSuccess((await api.get<RoleMenusResponse>(`/roles/${id}/menus`)).data);
  if (!Array.isArray(response.data) || response.data.some((menu) => !isValidEntityId(menu?.id) ||
    typeof menu.code !== "string" || typeof menu.label !== "string" ||
    (menu.parent_id !== null && !isValidEntityId(menu.parent_id)))) throw new Error("Respons assignment menu tidak valid.");
  return response;
};
export const syncRoleMenus = async (id: number, menuIds: number[]) => {
  const response = assertRoleWrite((await api.post<RoleWriteResponse>(`/roles/${id}/menus/sync`, { menu_ids: menuIds })).data, {}, id);
  assertAssignment(response.data.menus, menuIds, id);
  return response;
};
export class RoleDeleteResponseError extends Error {
  constructor() {
    super("Server belum mengonfirmasi penghapusan role. Periksa daftar sebelum mencoba lagi.");
    this.name = "RoleDeleteResponseError";
  }
}
export const deleteRole = async (id: number): Promise<RoleDeleteResponse> => {
  if (!isValidEntityId(id)) throw new Error("ID role tidak valid.");
  const response = await api.delete<RoleDeleteResponse>(`/roles/${id}`);
  if (response.status !== 200 || response.data?.success !== true || response.data.http_code !== 200 || response.data.data !== null) {
    throw new RoleDeleteResponseError();
  }
  return response.data;
};
