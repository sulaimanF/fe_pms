
"use client";

import { DataTables } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import type { OrganizationUnit } from "@/types/organizationUnit";

interface KcTableProps {
  data: OrganizationUnit[];
  organizations: readonly OrganizationUnit[];
}

export default function KcTable({
  data,
  organizations,
}: KcTableProps) {
  const {
    table,
  } = useDataTable({
    data,
    columns: columns(organizations),
  });

  return (
    <DataTables
      table={table}
      title="Kantor Cabang"
    />
  );
}
