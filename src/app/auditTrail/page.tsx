"use client";

import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { Download, RefreshCw } from "lucide-react";
import { DataTables } from "@/components/tables";
import { Button } from "@/components/ui/button";
import { AccessDenied, AccessGuard } from "@/components/auth/AccessGuard";
import { AuditDetailsDialog, AuditValueDialog } from "@/components/audit/AuditDialogs";
import type { AuditExpandedValue } from "@/components/audit/AuditDialogs";
import { useSessionQuery } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useAuditTable } from "@/hooks/useAuditTrail";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { AUDIT_EXPORT_AVAILABLE } from "@/services/auditTrail.services";
import type { AuditLog } from "@/types/auditTrail";
import { auditColumns } from "./columns";

export default function AuditTrailPage() {
  const session = useSessionQuery();
  return <AccessGuard permissions={ACCESS.auditList}><AuditTrailContent key={session.id} /></AccessGuard>;
}

function AuditTrailContent() {
  const access = useAuthorization();
  const [expandedValue, setExpandedValue] = useState<AuditExpandedValue | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const canViewDetail = access.can(ACCESS.auditDetail);
  const canExport = access.can(ACCESS.auditExport);
  const showValue = useCallback((label: string, text: string) => {
    if (canAccess(ACCESS.auditList)) setExpandedValue({ label, text });
  }, []);
  const showDetail = useCallback((row: AuditLog) => {
    if (canAccess(ACCESS.auditList) && canAccess(ACCESS.auditDetail)) setDetailId(row.id);
  }, []);
  const columns = useMemo(() => auditColumns({
    canViewDetail, onDetail: showDetail, onValue: showValue,
  }), [canViewDetail, showDetail, showValue]);
  const { table, query, setPagination } = useAuditTable(columns);
  const status = axios.isAxiosError(query.error) ? query.error.response?.status : undefined;
  const rejected = status !== undefined && status >= 400 && status < 500;
  const retry = <Button variant="outline" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>Coba lagi</Button>;

  if (isForbidden(query.error)) return <AccessDenied />;
  if (status === 401) return <p role="alert">Sesi tidak berlaku.</p>;
  if (query.error && (!query.data || rejected)) {
    return <div role="alert" className="space-y-3 rounded-xl border bg-background p-6">
      <p>Audit Trail gagal dimuat. Data kosong belum dapat dipastikan.</p>{retry}
    </div>;
  }

  const pagination = query.data?.pagination;
  const outsidePage = !!pagination && pagination.current_page > pagination.last_page;
  return <div className="space-y-3" aria-busy={query.isFetching}>
    {!!query.error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <p>Pembaruan Audit Trail gagal. Data terakhir pada sesi ini tetap ditampilkan.</p>{retry}
    </div>}
    {outsidePage && <div role="status" className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
      <p>Halaman ini tidak tersedia pada hasil terbaru.</p>
      <Button variant="outline" onClick={() => setPagination(current => ({ ...current, pageIndex: 0 }))}>Ke halaman pertama</Button>
    </div>}
    <div className="[&_table]:min-w-[1100px] [&_td]:py-2 [&_td]:align-top [&_th]:text-slate-600">
      <DataTables
        table={table}
        title="Audit Trail"
        description="Riwayat aktivitas yang dicatat backend, diurutkan dari timestamp terbaru."
        headerClassName="bg-[#f3f3f3]"
        loading={!query.data}
        pagination={!!query.data && !outsidePage}
        actions={<div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>
            <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden />Refresh
          </Button>
          <Button disabled={!canExport || !AUDIT_EXPORT_AVAILABLE} className="bg-blue-600 text-white hover:bg-blue-700">
            <Download className="size-4" aria-hidden />Download Data
          </Button>
        </div>}
        footer={<p className="text-sm text-muted-foreground">
          {pagination ? `Menampilkan ${pagination.from ?? 0}–${pagination.to ?? 0} dari ${pagination.total} log.` : "Memuat riwayat audit…"}
        </p>}
      />
    </div>
    {expandedValue && <AuditValueDialog value={expandedValue} onClose={() => setExpandedValue(null)} />}
    {detailId !== null && canViewDetail && <AuditDetailsDialog key={detailId} id={detailId} onClose={() => setDetailId(null)} />}
  </div>;
}
