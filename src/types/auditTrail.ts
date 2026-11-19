import type { ApiResponse } from "./common";

export type AuditJson =
  | string
  | number
  | boolean
  | null
  | AuditJson[]
  | { [key: string]: AuditJson };
export type AuditValue =
  | { state: "missing" }
  | { state: "present"; value: AuditJson };
export interface AuditLog {
  id: number;
  created_at: string;
  user_id: number | null;
  author: string;
  event_type: string;
  action: string | null;
  resource_type: string | null;
  resource_id: string | null;
  message: string | null;
  message_source: "metadata.notes" | "metadata.reason" | null;
  new_data: AuditValue;
}
export interface AuditPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}
export interface AuditListParams {
  page: number;
  perPage: number;
  sortDir: "asc" | "desc";
}
export type AuditListResponse = Omit<ApiResponse<AuditLog[]>, "pagination"> & {
  pagination: AuditPagination;
};
export type AuditDetailResponse = ApiResponse<AuditLog>;
