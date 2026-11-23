"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { WilayahTable } from "./wilayah";
import { KcpTable } from "./kcp";
import { KcTable } from "./kc";
import { Button } from "@/components/ui/button";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useOrganizationUnits } from "@/hooks/useOrganizationUnits";
import { useAllOutlets, useDeleteOutlet } from "@/hooks/useOutlets";
import OutletManagementSkeleton from "@/components/skeletons/TableSkeleton";
import ConfirmDialogs from "@/components/dialogs/ConfirmDialogs";
import OutletDetailsDialog from "@/components/outlet/OutletDetailsDialog";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { captureSession, isCurrentSession } from "@/lib/session";
import { isValidEntityId } from "@/lib/managementApi";
import { mapOutletRow } from "@/lib/outletManagement";
import type { OutletTableRow } from "@/lib/outletManagement";
import { OutletDeleteUncertainError } from "@/services/outlet.service";

export default function OutletManagementPage() {
  return (
    <AccessGuard permissions={ACCESS.outletList}>
      <OutletManagementContent />
    </AccessGuard>
  );
}
function OutletManagementContent() {
  const outletQuery = useAllOutlets();
  const organizationsQuery = useOrganizationUnits(true);
  const deletion = useDeleteOutlet();
  const access = useAuthorization();
  const [detail, setDetail] = useState<{
    id: number;
    sessionId: number;
  }>();
  const [target, setTarget] = useState<{
    id: number;
    name: string;
    sessionId: number;
  }>();
  const [deleteIssue, setDeleteIssue] = useState<{
    id: number;
    message: string;
  }>();
  const [checkingDelete, setCheckingDelete] = useState(false);
  const running = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const organizations = useMemo(
    () => organizationsQuery.data?.data ?? [],
    [organizationsQuery.data],
  );
  const wilayah = useMemo(
    () => organizations.filter((item) => item.unit_type === "wilayah"),
    [organizations],
  );
  const cabang = useMemo(
    () => organizations.filter((item) => item.unit_type === "cabang"),
    [organizations],
  );
  const organizationIndex = useMemo(
    () => new Map(organizations.map((item) => [item.id, item])),
    [organizations],
  );
  const outlets = useMemo(
    () =>
      (outletQuery.data?.data ?? []).map((outlet) =>
        mapOutletRow(outlet, organizationIndex),
      ),
    [outletQuery.data, organizationIndex],
  );
  const errors = [outletQuery.error, organizationsQuery.error].filter(Boolean);
  const fetching = outletQuery.isFetching || organizationsQuery.isFetching;
  const retry = () => {
    void outletQuery.refetch();
    void organizationsQuery.refetch();
  };
  const showDetail = (outlet: OutletTableRow) => {
    if (!canAccess(ACCESS.outletDetail) || !isValidEntityId(outlet.id)) return;
    setDetail({ id: outlet.id, sessionId: captureSession().id });
  };
  const askDelete = (outlet: OutletTableRow) => {
    if (
      running.current ||
      deletion.isPending ||
      deleteIssue ||
      !canAccess(ACCESS.outletDelete) ||
      !isValidEntityId(outlet.id)
    )
      return;
    setTarget({
      id: outlet.id,
      name: outlet.name,
      sessionId: captureSession().id,
    });
  };
  const confirmDelete = async () => {
    const context = captureSession();
    if (
      !target ||
      target.sessionId !== context.id ||
      !isCurrentSession(context) ||
      running.current ||
      deleteIssue ||
      !canAccess(ACCESS.outletDelete)
    )
      return;
    running.current = true;
    try {
      const response = await deletion.mutateAsync(target.id);
      if (!mounted.current || !isCurrentSession(context)) return;
      setTarget(undefined);
      setDetail(undefined);
      const message =
        typeof response.message === "string" && response.message.trim()
          ? response.message.trim().slice(0, 500)
          : "Outlet berhasil dihapus.";
      if (response.synchronizationFailed)
        toast.warning(
          `${message} Penghapusan terkonfirmasi, tetapi sinkronisasi data gagal. Jangan ulangi Delete.`,
        );
      else toast.success(message);
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context)) return;
      if (error instanceof OutletDeleteUncertainError) {
        setDeleteIssue({ id: target.id, message: error.message });
        setTarget(undefined);
      } else {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setTarget(undefined);
          setDetail(undefined);
          void outletQuery.refetch();
          toast.info(
            "Outlet tidak tersedia. Daftar dimuat ulang tanpa mengulang DELETE.",
          );
          return;
        }
        const body: unknown = axios.isAxiosError(error)
          ? error.response?.data
          : undefined;
        toast.error(
          isForbidden(error)
            ? "Akses penghapusan ditolak."
            : body &&
                typeof body === "object" &&
                "message" in body &&
                typeof body.message === "string"
              ? body.message.slice(0, 500)
              : "Penghapusan ditolak atau belum dapat dilakukan.",
        );
      }
    } finally {
      running.current = false;
    }
  };
  const checkDelete = async () => {
    if (!deleteIssue || checkingDelete) return;
    const context = captureSession(),
      issue = deleteIssue;
    setCheckingDelete(true);
    try {
      const result = await outletQuery.refetch({ throwOnError: true });
      if (!mounted.current || !isCurrentSession(context)) return;
      if (
        result.data &&
        !result.data.data.some((outlet) => outlet.id === issue.id)
      ) {
        setDeleteIssue(undefined);
        toast.info(
          "Outlet tidak ada pada daftar terkini. Tidak ada DELETE yang diulang; respons operasi sebelumnya tetap belum terkonfirmasi.",
        );
      } else
        setDeleteIssue({
          ...issue,
          message:
            "Outlet masih ditemukan. Hasil DELETE sebelumnya belum pasti; periksa dengan administrator sebelum mengulang.",
        });
    } catch {
      if (mounted.current && isCurrentSession(context))
        setDeleteIssue({
          ...issue,
          message:
            "Pemeriksaan daftar gagal. Ini bukan bukti penghapusan gagal.",
        });
    } finally {
      if (mounted.current && isCurrentSession(context))
        setCheckingDelete(false);
    }
  };
  if (errors.some(isForbidden)) return <AccessDenied />;
  if (
    errors.some(
      (error) => axios.isAxiosError(error) && error.response?.status === 401,
    )
  )
    return <p role="alert">Sesi tidak berlaku. Silakan login kembali.</p>;
  const rejected = errors.some(
    (error) =>
      axios.isAxiosError(error) &&
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500,
  );
  if (
    errors.length &&
    (!outletQuery.data || !organizationsQuery.data || rejected)
  )
    return (
      <div role="alert">
        Daftar Outlet atau organisasi gagal dimuat.{" "}
        <Button disabled={fetching} onClick={retry}>
          Coba lagi
        </Button>
      </div>
    );
  if (!outletQuery.data || !organizationsQuery.data)
    return <OutletManagementSkeleton />;
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Outlet Management</h1>
        {(access.can(ACCESS.outletCreate)||access.can(ACCESS.organizationCreate)) && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/outletManagement/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Outlet
            </Link>
          </Button>
        )}
      </div>
      {!!errors.length && (
        <p role="alert">
          Pembaruan data gagal. Data terakhir tetap ditampilkan.{" "}
          <Button variant="outline" disabled={fetching} onClick={retry}>
            Coba lagi
          </Button>
        </p>
      )}
      {deleteIssue && (
        <div role="alert" className="space-y-2">
          <p>{deleteIssue.message}</p>
          <Button
            variant="outline"
            disabled={checkingDelete || fetching}
            onClick={() => {
              void checkDelete();
            }}
          >
            {checkingDelete ? "Memeriksa..." : "Periksa daftar"}
          </Button>
        </div>
      )}
      
      <WilayahTable data={wilayah} />
      <KcTable data={cabang} organizations={organizations} />
      <KcpTable
        data={outlets}
        onView={showDetail}
        onDelete={askDelete}
        access={{
          view: access.can(ACCESS.outletDetail),
          edit: access.can(ACCESS.outletUpdate),
          delete: access.can(ACCESS.outletDelete),
          deleting: deletion.isPending || !!deleteIssue,
        }}
      />
      {detail &&
        detail.sessionId === captureSession().id &&
        access.can(ACCESS.outletDetail) && (
          <OutletDetailsDialog
            key={`${detail.sessionId}:${detail.id}`}
            id={detail.id}
            onClose={() => setDetail(undefined)}
          />
        )}
      <ConfirmDialogs
        open={
          !!target &&
          target.sessionId === captureSession().id &&
          access.can(ACCESS.outletDelete)
        }
        onOpenChange={(open) => {
          if (!open && !running.current) setTarget(undefined);
        }}
        title="Hapus Outlet?"
        description={`Hapus master Outlet ${target?.name ?? ""}? Backend menggunakan soft delete. Ini bukan pencabutan assignment User.`}
        onConfirm={() => {
          void confirmDelete();
        }}
        closeOnConfirm={false}
        loading={deletion.isPending}
        confirmText="Hapus"
        cancelText="Batal"
        loadingText="Menghapus..."
      />
    </div>
  );
}
