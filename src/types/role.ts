import { ApiResponse } from "./api";

export interface Role {
  id: number;
  code: string;
  name: string;
}

export type RoleResponse = ApiResponse<Role[]>;
// export interface RoleResponse {
//   success: boolean;
//   http_code: number;
//   request_id: string | null;
//   message: string;
//   data: Role[];
//   errors: unknown;
//   meta: unknown;
// }