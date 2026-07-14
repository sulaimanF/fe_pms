"use client";

import { DataTables, DataTablesSearch, DataTablesColumnToggle } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
// import { userData } from "./data";
import { useUsers } from "@/hooks/useUsers";

export default function UserManagementPage() {
  const {
    data,
    isLoading,
    error,
  } = useUsers();

  const {
    table,
    globalFilter,
    setGlobalFilter,
  } = useDataTable({
    data: data?.data ?? [],
    columns,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Terjadi kesalahan.</div>;
  }

  return (
    <DataTables
      table={table}
      headerClassName="bg-blue-600 text-white"
      title="User Management"
      description="Manage user data"
      toolbar={
        <div className="flex items-center justify-between w-full">

          <DataTablesColumnToggle table={table} />

          <div className="flex items-center gap-2">
            <DataTablesSearch
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search user..."
            />
          </div>
        </div>
      }
    />
  );
}