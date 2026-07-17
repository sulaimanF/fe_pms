import { ApiResponse } from "./api";
export interface Outlet {
  id: number;
  organization_unit_id: number;
  name: string;
  code: string;
  outlet_type: string;
}

export type OutletResponse = ApiResponse<Outlet[]>;
// export interface OutletResponse {
//   success: boolean;
//   http_code: number;
//   request_id: string | null;
//   message: string;
//   data: Outlet[];
//   errors: unknown;
//   meta: unknown;
// }