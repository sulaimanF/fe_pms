import api from "@/lib/axios";
import { assertEntityResponse, collectPages } from "@/lib/managementApi";
import type { RoleCreateRequest, RoleUpdateRequest, RoleListResponse, RoleDetailResponse, RoleWriteResponse } from "@/types/role";

export const getRoles = async (page?: number) => (await api.get<RoleListResponse>("/roles", { params: page ? { page, per_page: 100 } : undefined })).data;
export const getAllRoles = () => collectPages(getRoles);
export const getRoleById = async (id: number | string) => assertEntityResponse((await api.get<RoleDetailResponse>(`/roles/${id}`)).data);
export const createRole = async (payload: RoleCreateRequest) => assertEntityResponse((await api.post<RoleWriteResponse>("/roles", payload)).data);
export const updateRole = async (id: number, payload: RoleUpdateRequest) => assertEntityResponse((await api.put<RoleWriteResponse>(`/roles/${id}`, payload)).data);
export const syncRolePermissions = async (id: number, permissionIds: number[]) => assertEntityResponse((await api.post<RoleWriteResponse>(`/roles/${id}/permissions/sync`, { permission_ids: permissionIds })).data);
export const deleteRole = async (id: number) => (await api.delete(`/roles/${id}`)).data;
