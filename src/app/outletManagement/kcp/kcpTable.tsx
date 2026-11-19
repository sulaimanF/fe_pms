"use client";

import { DataTables, DataTablesSearch } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import type { OutletTableAccess } from "./columns";
import type { OutletTableRow } from "@/lib/outletManagement";

interface Props {
  data: OutletTableRow[];
  access: OutletTableAccess;
  onView: (outlet: OutletTableRow) => void;
  onDelete: (outlet: OutletTableRow) => void;
}
export default function KcpTable({ data, access, onView, onDelete }: Props) {
  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns: columns(onView, onDelete, access),
  });
  return (
    <DataTables
      table={table}
      title="Outlet"
      toolbar={
        <DataTablesSearch
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Cari Outlet..."
        />
      }
    />
  );
}
