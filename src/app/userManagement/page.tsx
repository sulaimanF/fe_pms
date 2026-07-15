"use client";

import { DataTables, DataTablesSearch, DataTablesColumnToggle } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";
import Loading from "./loading";

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
    return <Loading />;
  }

  if (error) {
    return <div>Terjadi kesalahan.</div>;
  }

  return (
    <DataTables
      table={table}
      title="User Management"
      description="Manage user data"
      headerClassName="bg-blue-600 text-white"
      actions={
        <Button
          asChild
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Link href="/userManagement/create">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Link>
        </Button>
      }
      toolbar={
        <div className="flex items-center justify-end w-full">
          <DataTablesSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Search user..."
          />
        </div>
      }
    />
  );
}