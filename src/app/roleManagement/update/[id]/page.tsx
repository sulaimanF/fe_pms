"use client";
import { useParams } from "next/navigation";
import UpdateRoleForm from "@/components/role/UpdateRoleForm";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import FormSkeleton from "@/components/skeletons/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRoles";
import { ACCESS, isForbidden } from "@/lib/authorization";
import { isValidEntityId } from "@/lib/managementApi";
export default function UpdateRolePage() {
  return <AccessGuard permissions={ACCESS.roleUpdate}><UpdateRoleContent /></AccessGuard>;
}
function UpdateRoleContent() {
  const params = useParams();
  const id = typeof params.id === "string" && /^[1-9]\d*$/.test(params.id) ? Number(params.id) : NaN;
  const query = useRole(id);
  if (!isValidEntityId(id)) return <p role="alert">ID role tidak valid.</p>;
  if (query.isLoading) return <FormSkeleton />;
  if (query.error) return isForbidden(query.error) ? <AccessDenied /> : <div role="alert">Detail role gagal dimuat. <Button onClick={() => { void query.refetch(); }}>Coba lagi</Button></div>;
  if (!query.data?.data || !Array.isArray(query.data.data.permissions)) return <p role="alert">Detail role belum lengkap.</p>;
  return <UpdateRoleForm key={id} role={query.data.data} />;
}
