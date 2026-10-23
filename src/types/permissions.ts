import type { ApiResponse } from "./common";
export interface Permission {
  id: number; code: string; module: string; resource: string; action: string;
  description: string | null; is_active: boolean; created_at: string;
}
export type PermissionResponse = ApiResponse<Permission[]>;
