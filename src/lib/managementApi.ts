import type { ApiResponse } from "@/types/common";
import { captureSession, assertSession } from "@/lib/session";

export function assertApiSuccess<T>(response: ApiResponse<T>): ApiResponse<T> {
  if (!response || response.success !== true) throw new Error("Server tidak mengonfirmasi keberhasilan.");
  return response;
}
export function assertEntityResponse<T extends { id: number }>(response: ApiResponse<T>) {
  assertApiSuccess(response);
  if (!response.data || !Number.isSafeInteger(response.data.id) || response.data.id <= 0) {
    throw new Error("Respons entity tidak valid.");
  }
  return response;
}
// Fetch numeric page parameters, never a URL supplied by the response.
export async function collectPages<T extends { id: number }>(fetchPage: (page: number) => Promise<ApiResponse<T[]>>) {
  const sessionId = captureSession().id;
  const collected = new Map<number, T>();
  let page = 1;
  for (;;) {
    assertSession(sessionId);
    const response = assertApiSuccess(await fetchPage(page));
    assertSession(sessionId);
    if (!Array.isArray(response.data)) throw new Error("Respons daftar tidak valid.");
    response.data.forEach((item) => { collected.set(item.id, item); });
    const pagination = response.pagination;
    if (pagination == null) return { ...response, data: [...collected.values()] };
    if (typeof pagination !== "object" || !("current_page" in pagination) || !("last_page" in pagination) ||
      pagination.current_page !== page || typeof pagination.last_page !== "number" ||
      !Number.isSafeInteger(pagination.last_page) || pagination.last_page < page) {
      throw new Error("Pagination lookup tidak valid.");
    }
    if (page === pagination.last_page) return { ...response, data: [...collected.values()] };
    if (page >= 1000) throw new Error("Lookup terlalu besar; gunakan pencarian backend.");
    page++;
  }
}
export const isValidEntityId = (id: unknown): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0;
