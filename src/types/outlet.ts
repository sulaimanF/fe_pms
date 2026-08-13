import { ApiResponse } from "./api";
export interface OutletOrganizationUnit {
  id: number;
  name: string;
  code: string;
}

export interface Outlet {
  id: number;
  organization_unit_id: number;
  code: string;
  name: string;
  outlet_type: string;

  address: string;
  city: string;
  province: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;

  latitude: string;
  longitude: string;

  opening_date: string;
  closing_date: string | null;

  manager_user_id: number | null;

  is_active: boolean;

  operating_hours: {
    mon: {
      open: string;
      close: string;
    } | null;

    tue: {
      open: string;
      close: string;
    } | null;

    wed: {
      open: string;
      close: string;
    } | null;

    thu: {
      open: string;
      close: string;
    } | null;

    fri: {
      open: string;
      close: string;
    } | null;

    sat: {
      open: string;
      close: string;
    } | null;

    sun: {
      open: string;
      close: string;
    } | null;
  } | null;

  metadata: {
    capacity?: number;
  } | null;

  created_at: string;
  updated_at: string;

  created_by: number | null;
  updated_by: number | null;

  deleted_at: string | null;

  organization_unit: OutletOrganizationUnit;
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