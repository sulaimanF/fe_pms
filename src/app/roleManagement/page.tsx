"use client";

import { DataTables, DataTablesSearch } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteRole, useRoles } from "@/hooks/useRoles";
import TableSkeletons from "@/components/skeletons/TableSkeleton";
import ConfirmDialogs from "@/components/dialogs/ConfirmDialogs";
import { useState } from "react";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";
import { toast } from "sonner";


export default function RoleManagementPage() {
  return <AccessGuard permissions={ACCESS.roleList}><RoleManagementContent /></AccessGuard>;
}

function RoleManagementContent() {
  const access = useAuthorization();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const deleteRoleMutation = useDeleteRole();
  const handleDelete = (id: number) => {
    if (!canAccess(ACCESS.roleDelete)) {
      toast.error("Anda tidak memiliki izin untuk menghapus role.");
      return;
    }
    setSelectedId(id);
    setOpenDialog(true);
  };

  const confirmDelete = () => {
    if (!canAccess(ACCESS.roleDelete)) {
      setOpenDialog(false);
      toast.error("Anda tidak memiliki izin untuk menghapus role.");
      return;
    }
    if (!selectedId || deleteRoleMutation.isPending) return;

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
    columns: columns(handleDelete, {
      edit: access.can(ACCESS.roleUpdate),
      delete: access.can(ACCESS.roleDelete),
    }),
  });

  if (isLoading) {
    return <TableSkeletons />;
  }

  if (error) {
    if (isForbidden(error)) return <AccessDenied />;
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
          access.can(ACCESS.roleCreate) && <Button
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
        open={openDialog && access.can(ACCESS.roleDelete)}
        onOpenChange={setOpenDialog}
        title="Delete Role"
        description="Are you sure you want to delete this role?"
        onConfirm={confirmDelete}
        loading={deleteRoleMutation.isPending}
      />
    </>
  );
  
}
