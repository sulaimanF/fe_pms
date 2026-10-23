import type { ApiResponse } from "./common";

export interface RolePermission {
  id: number; code: string; module: string; resource: string; action: string;
}
export interface Role {
  id: number; code: string; name: string;
  description: string | null; landing_page: string | null; is_active: boolean;
  permissions?: RolePermission[]; users_count?: number;
}
export interface RoleCreateRequest { code: string; name: string; description?: string | null }
export type RoleUpdateRequest = Partial<RoleCreateRequest>;
export type RoleListResponse = ApiResponse<Role[]>;
export type RoleDetailResponse = ApiResponse<Role>;
export type RoleWriteResponse = ApiResponse<Pick<Role, "id" | "code" | "name"> & Partial<Role>>;
