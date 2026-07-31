// import { ApiResponse } from "./api";

export interface RolePermission {
  id: number;
  code: string;
  module: string;
  resource: string;
  action: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
  landing_page: string;
  is_active: boolean;

  permissions: RolePermission[];
}

export interface RoleResponse {
  success: boolean;
  message: string;
  data: Role;
}
// export type RoleResponse = ApiResponse<Role[]>;
// export interface RoleResponse {
//   success: boolean;
//   http_code: number;
//   request_id: string | null;
//   message: string;
//   data: Role[];
//   errors: unknown;
//   meta: unknown;
// }