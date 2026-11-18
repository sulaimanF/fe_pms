"use client";

import { useParams } from "next/navigation";
import axios from "axios";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import FormSkeleton from "@/components/skeletons/FormSkeleton";
import { Button } from "@/components/ui/button";
import UpdateOutletForm from "@/components/outlet/UpdateOutletForm";
import { useOutlet } from "@/hooks/useOutlets";
import { useSessionQuery } from "@/hooks/useAuth";
import { ACCESS, isForbidden } from "@/lib/authorization";
import { isValidEntityId } from "@/lib/managementApi";

export default function UpdateOutletPage() {
  return <AccessGuard permissions={ACCESS.outletUpdate}><UpdateOutletContent /></AccessGuard>;
}
function UpdateOutletContent() {
  const params = useParams();
  const id = typeof params.id === "string" && /^[1-9]\d*$/.test(params.id) ? Number(params.id) : NaN;
  const query = useOutlet(id), session = useSessionQuery();
  const status = axios.isAxiosError(query.error) ? query.error.response?.status : undefined;
  if (!isValidEntityId(id)) return <p role="alert">ID Outlet tidak valid.</p>;
  if (isForbidden(query.error)) return <AccessDenied />;
  if (status === 401) return <p role="alert">Sesi tidak berlaku. Silakan login kembali.</p>;
  if (query.error && (!query.data || (status !== undefined && status >= 400 && status < 500))) return <div role="alert">{status === 404 ? "Outlet tidak tersedia." : "Detail Outlet gagal dimuat."} <Button disabled={query.isFetching} onClick={() => { void query.refetch(); }}>Coba lagi</Button></div>;
  if (!query.data && query.isLoading) return <FormSkeleton />;
  if (!query.data || query.data.data.id !== id) return <p role="alert">Detail Outlet belum tersedia.</p>;
  return <div className="space-y-4">
    {!!query.error && <p role="alert">Pembaruan detail gagal. Draft tetap dipertahankan. <Button disabled={query.isFetching} variant="outline" onClick={() => { void query.refetch(); }}>Coba lagi</Button></p>}
    <UpdateOutletForm key={`${session.id}:${id}`} outlet={query.data.data} />
  </div>;
}
