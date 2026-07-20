import { ApiResponse } from "./api";

export interface OrganizationUnit {
  id: number;
  code: string;
  name: string;
  // outlets: Outlet[];
}

export type OrganizationUnitResponse = ApiResponse<OrganizationUnit[]>;
// export interface OrganizationUnitResponse {
//   success: boolean;
//   http_code: number;
//   request_id: string | null;
//   message: string;
//   data: OrganizationUnit[];
//   errors: unknown;
//   meta: unknown;
// }