"use client";

import { useParams } from "next/navigation";
import UpdateUserForm from "@/components/user/UpdateUserForm";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import FormSkeleton from "@/components/skeletons/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUsers";
import { ACCESS, isForbidden } from "@/lib/authorization";
import { isValidEntityId } from "@/lib/managementApi";
import { useSessionQuery } from "@/hooks/useAuth";
import axios from "axios";

export default function UpdateUserPage() {
  return <AccessGuard permissions={ACCESS.userUpdate}><UpdateUserContent /></AccessGuard>;
}

function UpdateUserContent() {
  const params = useParams();
  const id = typeof params.id === "string" && /^[1-9]\d*$/.test(params.id) ? Number(params.id) : NaN;
  const query = useUser(id);
  const session = useSessionQuery();
  const status = axios.isAxiosError(query.error) ? query.error.response?.status : undefined;
  if (!isValidEntityId(id)) return <p role="alert">ID user tidak valid.</p>;
  if (isForbidden(query.error)) return <AccessDenied />;
  if (status === 401) return <p role="alert">Sesi tidak berlaku. Silakan login kembali.</p>;
  // Retained data must not override an explicit rejection of this detail endpoint.
  const deniedDetail = status !== undefined && status >= 400 && status < 500;
  if ((!query.data || deniedDetail) && query.error) return <div role="alert">Detail user gagal dimuat. <Button disabled={query.isFetching} onClick={() => { void query.refetch(); }}>Coba lagi</Button></div>;
  if (!query.data && query.isLoading) return <FormSkeleton />;
  if (!query.data?.data || query.data.data.id !== id || !Array.isArray(query.data.data.roles) || !Array.isArray(query.data.data.outlets)) return <p role="alert">Detail user belum lengkap.</p>;
  return <div className="space-y-4">
    {!!query.error && <div role="alert">Pembaruan detail user gagal. Isian Anda tetap dipertahankan. <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>Coba lagi</Button></div>}
    <UpdateUserForm key={`${session.id}:${id}`} user={query.data.data} />
  </div>;
}
