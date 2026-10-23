"use client";
import { useParams } from "next/navigation";
import UpdateUserForm from "@/components/user/UpdateUserForm";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import FormSkeleton from "@/components/skeletons/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUsers";
import { ACCESS, isForbidden } from "@/lib/authorization";
import { isValidEntityId } from "@/lib/managementApi";
export default function UpdateUserPage() {
  return <AccessGuard permissions={ACCESS.userUpdate}><UpdateUserContent /></AccessGuard>;
}
function UpdateUserContent() {
  const params = useParams();
  const id = typeof params.id === "string" && /^[1-9]\d*$/.test(params.id) ? Number(params.id) : NaN;
  const query = useUser(id);
  if (!isValidEntityId(id)) return <p role="alert">ID user tidak valid.</p>;
  if (query.isLoading) return <FormSkeleton />;
  if (query.error) return isForbidden(query.error) ? <AccessDenied /> : <div role="alert">Detail user gagal dimuat. <Button onClick={() => { void query.refetch(); }}>Coba lagi</Button></div>;
  if (!query.data?.data || !Array.isArray(query.data.data.roles) || !Array.isArray(query.data.data.outlets)) return <p role="alert">Detail user belum lengkap.</p>;
  return <UpdateUserForm key={id} user={query.data.data} />;
}
