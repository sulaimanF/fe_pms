export interface ApiResponse<T> {
  success: boolean;
  http_code: number;
  request_id: string | null;
  message: string;
  data: T;
  errors: unknown;
  meta: unknown;
  pagination: unknown;
}