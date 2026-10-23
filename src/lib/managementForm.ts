import axios from "axios";
import { AccessDeniedError } from "@/lib/authorization";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export interface RequestFailure { status?: number; fields: Record<string, string> }
export function sameAssignmentIds(first: readonly number[], second: readonly number[]) {
  const a = new Set(first), b = new Set(second);
  return a.size === b.size && [...a].every((id) => b.has(id));
}
export function readRequestFailure(error: unknown): RequestFailure {
  if (error instanceof PartialSaveError) return error.failure;
  const failure: RequestFailure = { fields: {} };
  if (error instanceof AccessDeniedError) return { status: 403, fields: {} };
  if (!axios.isAxiosError(error)) return failure;
  failure.status = error.response?.status;
  const body: unknown = error.response?.data;
  if (failure.status === 422 && body && typeof body === "object" && "errors" in body &&
    body.errors && typeof body.errors === "object") {
    for (const [field, value] of Object.entries(body.errors)) {
      const text = Array.isArray(value) ? value.find((item) => typeof item === "string") : value;
      if (typeof text === "string") failure.fields[field] = text.slice(0, 500);
    }
  }
  return failure;
}
export class PartialSaveError extends Error {
  constructor(public readonly entityId: number, public readonly phase: "permissions" | "roles", public readonly failure: RequestFailure) {
    super(failure.status === 403 ? "Data utama tersimpan, tetapi akses assignment ditolak (403). Tidak ada logout otomatis." :
      "Data utama tersimpan, tetapi assignment belum tersimpan. Ulangi assignment tanpa membuat entity baru.");
    this.name = "PartialSaveError";
  }
}
export function applyFormFailure<T extends FieldValues>(form: UseFormReturn<T>, error: unknown, fields: readonly Path<T>[]) {
  const failure = readRequestFailure(error);
  let unmapped = false;
  for (const [key, message] of Object.entries(failure.fields)) {
    const target = fields.find((field) => key === field || key.startsWith(field + "."));
    if (target) form.setError(target, { type: "server", message });
    else unmapped = true;
  }
  const message = error instanceof PartialSaveError ? error.message :
    failure.status === 403 ? "Akses ditolak oleh server. Data form tetap dipertahankan." :
    failure.status === 422 ? "Periksa isian form. Server menolak validasi data." :
    failure.status === 401 ? "Sesi telah berakhir. Silakan login kembali." :
    "Penyimpanan gagal. Periksa koneksi atau coba lagi; data form tetap dipertahankan.";
  if (unmapped || !Object.keys(failure.fields).length || error instanceof PartialSaveError) {
    form.setError("root.server", { type: "server", message });
  }
  return message;
}
