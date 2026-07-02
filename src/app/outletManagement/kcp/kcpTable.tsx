
"use client";

import { DataTables, DataTablesSearch, DataTablesColumnToggle } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import { kcp } from "./data";

export default function KcpTable() {
  const {
    table,
    globalFilter,
    setGlobalFilter,
  } = useDataTable({
    data: kcp,
    columns,
  });

  return (
    <DataTables
      table={table}
      title="Kantor Cabang Pembantu"
    />
  );
}