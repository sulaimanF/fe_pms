// import { ApiResponse } from "./api";

export interface OrganizationParent {
  id: number;
  name: string;
  code: string;
}

export interface OrganizationUnit {
  id: number;
  parent_id: number | null;
  code: string;
  name: string;
  full_name: string;
  unit_type: "pusat" | "wilayah" | "cabang" | "kcp";
  level_no: number;
  region_code: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  manager_user_id: number | null;
  is_active: boolean;
  sort_order: number;
  metadata: {
    kode_wilayah?: string;
  } | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  deleted_at: string | null;
  parent: OrganizationParent | null;
  jumlah_kc?: number;
  jumlah_kcp?: number;
}

export interface OrganizationPagination {
  per_page: number;
  current_page: number;
  from: number;
  to: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  total: number;
  last_page: number;
}

// export type OrganizationUnitResponse = ApiResponse<OrganizationUnit[]>;
export interface OrganizationUnitResponse {
  success: boolean;
  http_code: number;
  request_id: string | null;
  message: string;
  data: OrganizationUnit[];
  errors: unknown;
  meta: unknown;
  pagination: OrganizationPagination | null;
}