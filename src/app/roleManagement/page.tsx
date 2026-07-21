"use client";

import { DataTables, DataTablesSearch, DataTablesColumnToggle } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteRole, useRoles } from "@/hooks/useRoles";
import TableSkeletons from "@/components/skeletons/TableSkeleton";
import ConfirmDialogs from "@/components/dialogs/ConfirmDialogs";
import { useState } from "react";


export default function RoleManagementPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const deleteRoleMutation = useDeleteRole();
  const handleDelete = (id: number) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedId) return;

    deleteRoleMutation.mutate(selectedId, {
      onSuccess: () => {
        setOpenDialog(false);
        setSelectedId(null);
      },
    });
  };
  
  const {
    data,
    isLoading,
    error,
  } = useRoles();

  const {
    table,
    globalFilter,
    setGlobalFilter,
  } = useDataTable({
    data: data?.data ?? [],
    columns: columns(handleDelete),
  });

  if (isLoading) {
    return <TableSkeletons />;
  }

  if (error) {
    return <div>Terjadi kesalahan.</div>;
  }

  return (
    <>
      <DataTables
        table={table}
        title="Role Management"
        description="Manage role data"
        headerClassName="bg-blue-600 text-white"
        actions={
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Link href="/roleManagement/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Link>
          </Button>
        }
        toolbar={
          <div className="flex items-center justify-end w-full">
            <DataTablesSearch
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search role..."
            />
          </div>
        }
      />

      <ConfirmDialogs
        open={openDialog}
        onOpenChange={setOpenDialog}
        title="Delete Role"
        description="Are you sure you want to delete this role?"
        onConfirm={confirmDelete}
        loading={deleteRoleMutation.isPending}
      />
    </>
  );
  
}