import type { ApiResponse } from "./common";

export const OUTLET_TYPES = ["branch", "kiosk", "atm", "agent", "office"] as const;
export type OutletType = typeof OUTLET_TYPES[number];
export type OutletJson = string | number | boolean | null | OutletJson[] | { [key: string]: OutletJson };
export type OutletJsonContainer = OutletJson[] | { [key: string]: OutletJson };
export interface OutletOrganizationUnit { id: number; name: string; code: string }
export interface Outlet {
  id: number;
  organization_unit_id: number;
  code: string;
  name: string;
  outlet_type: OutletType | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  latitude: string | null;
  longitude: string | null;
  opening_date: string | null;
  closing_date: string | null;
  manager_user_id: number | null;
  is_active: boolean;
  operating_hours: OutletJsonContainer | null;
  metadata: OutletJsonContainer | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  deleted_at: string | null;
  organization_unit?: OutletOrganizationUnit | null;
  manager?: { id: number; full_name: string; email: string } | null;
}
export interface OutletCreateRequest {
  organization_unit_id: number;
  code: string;
  name: string;
  outlet_type?: OutletType | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_date?: string | null;
  closing_date?: string | null;
  manager_user_id?: number | null;
  is_active?: boolean;
  operating_hours?: OutletJsonContainer | null;
  metadata?: OutletJsonContainer | null;
}
export type OutletUpdateRequest = Partial<OutletCreateRequest>;
export type OutletResponse = ApiResponse<Outlet[]>;
export type OutletDetailResponse = ApiResponse<Outlet>;
