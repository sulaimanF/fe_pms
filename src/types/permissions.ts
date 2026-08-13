export interface Permission {
  id: number;
  code: string;
  module: string;
  resource: string;
  action: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface PermissionResponse {
  success: boolean;
  http_code: number;
  message: string;
  data: Permission[];
}