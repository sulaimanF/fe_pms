
"use client";

import { DataTables, DataTablesSearch, DataTablesColumnToggle } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import type { OrganizationUnit } from "@/types/organizationUnit";
// import { kantorWilayah } from "./data";

interface WilayahTableProps {
  data: OrganizationUnit[];
}

export default function WilayahTable({
  data,
}: WilayahTableProps) {
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
      title="Kantor Wilayah"
    />
  );
}