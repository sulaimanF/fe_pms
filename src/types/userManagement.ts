import type { Role } from "./role";
import type { OrganizationUnit } from "./organizationUnit";
import type { ApiResponse } from "./common";

export type UserAssignedRole = Pick<Role, "id" | "code" | "name"> & Partial<Role> & {
  pivot?: {
    user_id: number;
    role_id: number;
    scope_type: string | null;
    scope_id: number | null;
    assigned_at: string | null;
    expires_at: string | null;
    is_active: boolean
  };
};
export interface UserAssignedOutlet {
  id: number;
  name: string;
  organization_unit_id?: number | null;
  pivot?: {
    user_id: number;
    outlet_id: number;
    assigned_role: string | null;
    is_primary: boolean;
    assigned_at: string | null;
    assigned_by: number | null;
    revoked_at: string | null
  };
}

export interface UserManagement {
  id: number;
  code: string | null;
  username: string;
  email: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  organization_unit_id: number | null;
  is_active: boolean;
  blocked_at: string | null;
  blocked_by: number | null;
  two_factor_confirmed_at: string | null;
  password_changed_at: string | null;
  created_at: string; updated_at: string;
  organization_unit?: Pick<OrganizationUnit, "id" | "name" | "code"> | null;
  roles?: UserAssignedRole[]; outlets?: UserAssignedOutlet[];
}
export interface UserCreateRequest {
  username: string;
  email: string;
  full_name: string;
  display_name?: string | null;
  phone?: string | null;
  password: string;
  password_confirmation: string;
  organization_unit_id?: number | null;
  is_active?: boolean;
  role_ids: number[];
  outlet_ids: number[];
}
export type UserUpdateRequest = Partial<UserCreateRequest>;
export interface Pagination { per_page: number; current_page: number; total: number; last_page: number }
export type UserResponse = ApiResponse<UserManagement[]>;
export type UserDetailResponse = ApiResponse<UserManagement>;
export type UserWriteResponse = ApiResponse<Pick<UserManagement, "id" | "username" | "email" | "full_name"> & Partial<UserManagement>>;
