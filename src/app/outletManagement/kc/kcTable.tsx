
"use client";

import { DataTables, DataTablesSearch, DataTablesColumnToggle } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import { kc } from "./data";

export default function KcTable() {
  const {
    table,
    globalFilter,
    setGlobalFilter,
  } = useDataTable({
    data: kc,
    columns,
  });

  return (
    <DataTables
      table={table}
      title="Kantor Cabang"
    />
  );
}