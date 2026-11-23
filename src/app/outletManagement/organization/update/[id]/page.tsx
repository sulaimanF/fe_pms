"use client"

import { useParams } from "next/navigation"
import axios from "axios"
import { AccessDenied, AccessGuard } from "@/components/auth/AccessGuard"
import FormSkeleton from "@/components/skeletons/FormSkeleton"
import { Button } from "@/components/ui/button"
import UpdateOrganizationForm from "@/components/outlet/UpdateOrganizationForm"
import { useOutletOrganization } from "@/hooks/useOutletOrganizations"
import { useSessionQuery } from "@/hooks/useAuth"
import { ACCESS, isForbidden } from "@/lib/authorization"
import { isValidEntityId } from "@/lib/managementApi"

export default function UpdateOrganizationPage() {
  return (
    <AccessGuard permissions={ACCESS.organizationUpdate}>
      <Content />
    </AccessGuard>
  );
}
function Content() {
  const params = useParams(),
    id =
      typeof params.id === "string" && /^[1-9]\d*$/.test(params.id)
        ? Number(params.id)
        : NaN;
  const query = useOutletOrganization(id),
    session = useSessionQuery(),
    status = axios.isAxiosError(query.error)
      ? query.error.response?.status
      : undefined;
  if (!isValidEntityId(id))
    return <p role="alert">ID organisasi tidak valid.</p>;
  if (isForbidden(query.error)) return <AccessDenied />;
  if (status === 401) return <p role="alert">Sesi tidak berlaku.</p>;
  if (
    query.error &&
    (!query.data || (status !== undefined && status >= 400 && status < 500))
  )
    return (
      <div role="alert">
        {status === 404
          ? "Organisasi tidak tersedia."
          : "Detail organisasi gagal dimuat."}{" "}
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          Coba lagi
        </Button>
      </div>
    );
  if (!query.data) return <FormSkeleton />;
  const unit = query.data.data;
  if (unit.id !== id) return <p role="alert">Detail tidak sesuai ID.</p>;
  if (unit.unit_type !== "wilayah" && unit.unit_type !== "cabang")
    return (
      <p role="alert">Halaman ini hanya mengelola Wilayah dan Kantor Cabang.</p>
    );
  return (
    <div className="space-y-4 rounded-xl bg-gray-50 p-3 sm:p-6">
      {!!query.error && (
        <p role="alert">
          Pembaruan detail gagal. Draft tetap dipertahankan.{" "}
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => {
              void query.refetch();
            }}
          >
            Coba lagi
          </Button>
        </p>
      )}
      <UpdateOrganizationForm key={`${session.id}:${id}`} organization={unit} />
    </div>
  );
}
