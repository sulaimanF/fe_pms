export interface Permission {
  id: number;
  code: string;
  module: string;
  resource: string;
  action: string;
  description: string;
  is_active: boolean;
}

export interface PermissionResponse {
  success: boolean;
  message: string;
  data: Permission[];
}