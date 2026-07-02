
"use client";

import { DataTables, DataTablesSearch, DataTablesColumnToggle } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import { kantorWilayah } from "./data";

export default function WilayahTable() {
  const {
    table,
    globalFilter,
    setGlobalFilter,
  } = useDataTable({
    data: kantorWilayah,
    columns,
  });

  return (
    <DataTables
      table={table}
      title="Kantor Wilayah"
    />
  );
}