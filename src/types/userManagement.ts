import { Role } from "./role";
import { Outlet } from "./outlet";
import { OrganizationUnit } from "./organizationUnit";
import { ApiResponse } from "./api";

export interface UserManagement {
  id: number;
  code: string;
  username: string;
  email: string;
  full_name: string;
  display_name: string;
  avatar_url: string | null;
  phone: string;
  organization_unit_id: number;
  is_active: boolean;
  blocked_at: string | null;
  blocked_by: number | null;
  two_factor_confirmed_at: string | null;
  password_changed_at: string;
  created_at: string;
  updated_at: string;

  organization_unit: OrganizationUnit;
  roles: Role[];
  outlets: Outlet[];
}

export interface Pagination {
  per_page: number;
  current_page: number;
  total: number;
  last_page: number;
}

export interface UserResponse extends ApiResponse<UserManagement[]> {
  pagination: Pagination;
}

export interface UserDetailResponse extends ApiResponse<UserManagement> {}

// export interface UserResponse {
//   success: boolean;
//   http_code: number;
//   request_id: string | null;
//   message: string;
//   data: UserManagement[];
//   errors: unknown;
//   meta: unknown;
//   pagination: Pagination;
// }

// export interface UserDetailResponse {
//   success: boolean;
//   http_code: number;
//   request_id: string | null;
//   message: string;
//   data: UserManagement;
//   errors: unknown;
//   meta: unknown;
// }