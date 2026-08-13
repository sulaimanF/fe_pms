
"use client";

import { DataTables } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import type { OrganizationUnit } from "@/types/organizationUnit";

interface KcTableProps {
  data: OrganizationUnit[];
}

export default function KcTable({
  data,
}: KcTableProps) {
  const {
    table,
    globalFilter,
    setGlobalFilter,
  } = useDataTable({
    data,
    columns,
  });

  return (
    <DataTables
      table={table}
      title="Kantor Cabang"
    />
  );
}