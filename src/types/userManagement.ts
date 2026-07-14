export interface OrganizationUnit {
  id: number;
  name: string;
  code: string;
}

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
}

export interface Pagination {
  per_page: number;
  current_page: number;
  total: number;
  last_page: number;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: UserManagement[];
  pagination: Pagination;
}