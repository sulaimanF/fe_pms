
"use client";

import { DataTables } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns, Kcp } from "./columns";

interface KcpTableProps {
  data: Kcp[];
}

export default function KcpTable({
  data,
}: KcpTableProps) {
  const {
    table,
  } = useDataTable({
    data,
    columns,
  });

  return (
    <DataTables
      table={table}
      title="Kantor Cabang Pembantu"
    />
  );
}