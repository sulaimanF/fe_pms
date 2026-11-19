"use client";

import axios from "axios";
import type { ZodError } from "zod";
import { readRequestFailure } from "@/lib/managementForm";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AccessDenied } from "@/components/auth/AccessGuard";
import { isForbidden } from "@/lib/authorization";
import FormSkeleton from "@/components/skeletons/FormSkeleton";
import type { ParameterFilters } from "@/types/parameterPenilaian";

export function parameterValidationErrors(error: ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [
      String(issue.path[0] ?? "root"),
      issue.message,
    ]),
  );
}
export function parameterRequestErrors(error: unknown) {
  const failure = readRequestFailure(error),
    errors: Record<string, string> = {};
  for (const [key, message] of Object.entries(failure.fields))
    errors[key.split(".")[0]] = message;
  errors.root =
    failure.status === 403
      ? "Akses ditolak. Isian tetap dipertahankan."
      : failure.status === 401
        ? "Sesi tidak berlaku."
        : failure.status === 422
          ? "Periksa isian yang ditolak backend."
          : error instanceof Error && !axios.isAxiosError(error)
            ? error.message
            : "Operasi gagal; isian tetap dipertahankan.";
  return errors;
}
export function ParameterReadBoundary({
  data,
  error,
  fetching,
  retry,
  children,
}: {
  data: unknown;
  error: unknown;
  fetching: boolean;
  retry: () => void;
  children: React.ReactNode;
}) {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (isForbidden(error)) return <AccessDenied />;
  if (status === 401) return <p role="alert">Sesi tidak berlaku.</p>;
  if (
    error &&
    (!data || (status !== undefined && status >= 400 && status < 500))
  )
    return (
      <div role="alert">
        {status === 404 ? "Data tidak tersedia." : "Data gagal dimuat."}{" "}
        <Button disabled={fetching} onClick={retry}>
          Coba lagi
        </Button>
      </div>
    );
  if (!data) return <FormSkeleton />;
  return (
    <div className="space-y-4">
      {!!error && (
        <p role="alert">
          Pembaruan data gagal. Data/draft terakhir dipertahankan.{" "}
          <Button disabled={fetching} variant="outline" onClick={retry}>
            Coba lagi
          </Button>
        </p>
      )}
      {children}
    </div>
  );
}
export interface ParameterAttempt {
  payload: object;
  id?: number;
  message: string;
  filters: ParameterFilters;
}
export function ParameterWriteNotice({
  attempt,
  pending,
  onCheck,
  onRelease,
}: {
  attempt: ParameterAttempt;
  pending: boolean;
  onCheck: () => void;
  onRelease: () => void;
}) {
  return (
    <div role="alert" className="space-y-3 rounded-md border p-4">
      <p>{attempt.message}</p>
      <p>
        Save diblokir. Pemeriksaan memakai snapshot percobaan sebelumnya; tidak
        mengulang penyimpanan.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          variant="outline"
          onClick={onCheck}
        >
          Periksa hasil
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Percobaan baru...
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hasil sebelumnya belum pasti</AlertDialogTitle>
              <AlertDialogDescription>
                Request mungkin sudah tersimpan atau masih diproses. Periksa
                dengan administrator terlebih dahulu. Create baru dapat menambah
                data kedua, update baru dapat menimpa perubahan. Melanjutkan
                hanya membuka Save, tanpa mengirim request.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={onRelease}>
                Saya memahami risiko
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
