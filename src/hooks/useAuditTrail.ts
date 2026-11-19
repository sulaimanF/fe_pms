"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useSessionQuery } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS, assertAccess } from "@/lib/authorization";
import { requestInSession } from "@/lib/session";
import { sessionQueryKey } from "@/lib/queryClient";
import { isValidEntityId } from "@/lib/managementApi";
import {
  getAuditLog,
  getAuditLogs,
  validAuditParams,
} from "@/services/auditTrail.services";
import type { AuditListParams, AuditLog } from "@/types/auditTrail";

export function useAuditLogs(params: AuditListParams) {
  const session = useSessionQuery(),
    access = useAuthorization(ACCESS.auditList);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "audit-logs", params),
    enabled: session.enabled && access.allowed && validAuditParams(params),
    queryFn: ({ signal }) =>
      requestInSession(session.id, () => {
        assertAccess(session.id, ACCESS.auditList);
        return getAuditLogs(params, signal);
      }),
  });
}
export function useAuditLog(id: number) {
  const session = useSessionQuery(),
    access = useAuthorization(ACCESS.auditDetail);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "audit-log", id),
    enabled: session.enabled && access.allowed && isValidEntityId(id),
    queryFn: ({ signal }) =>
      requestInSession(session.id, () => {
        assertAccess(session.id, ACCESS.auditDetail);
        return getAuditLog(id, signal);
      }),
  });
}
export function useAuditTable(columns: ColumnDef<AuditLog>[]) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const query = useAuditLogs({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    sortDir: "desc",
  });
  const rows = useMemo(() => query.data?.data ?? [], [query.data]);
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id + ":" + row.created_at,
    manualPagination: true,
    manualSorting: true,
    enableSorting: false,
    enableGlobalFilter: false,
    enableRowSelection: false,
    pageCount: query.data?.pagination.last_page ?? 1,
    rowCount: query.data?.pagination.total ?? 0,
    autoResetPageIndex: false,
    state: { pagination },
    onPaginationChange: setPagination,
  });
  return { table, query, pagination, setPagination };
}
