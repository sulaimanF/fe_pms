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
import { useEffect, useRef, useState } from "react";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";
import { toast } from "sonner";
import axios from "axios";
import { captureSession, isCurrentSession } from "@/lib/session";
import { isValidEntityId } from "@/lib/managementApi";
import type { Role } from "@/types/role";

export default function RoleManagementPage() {
  return <AccessGuard permissions={ACCESS.roleList}><RoleManagementContent /></AccessGuard>;
}

function RoleManagementContent() {
  const access = useAuthorization();
  const [selectedRole, setSelectedRole] = useState<(Pick<Role, "id" | "name" | "is_system"> & { sessionId: number }) | null>(null);
  const deleteRoleMutation = useDeleteRole();
  const deleting = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  
  const handleDelete = (role: Role) => {
    if (deleteRoleMutation.isPending) return;
    if (!canAccess(ACCESS.roleDelete)) {
      toast.error("Anda tidak memiliki izin untuk menghapus role.");
      return;
    }
    if (!isValidEntityId(role.id) || role.is_system !== false) {
      toast.error("Role tidak valid atau merupakan system Role yang tidak dapat dihapus."); return;
    }
    setSelectedRole({ id: role.id, name: role.name, is_system: role.is_system, sessionId: captureSession().id });
  };

  const confirmDelete = async () => {
    if (!selectedRole || deleting.current || deleteRoleMutation.isPending) return;
    const context = captureSession();
    if (!isCurrentSession(context) || context.id !== selectedRole.sessionId) return;
    if (!canAccess(ACCESS.roleDelete)) {
      setSelectedRole(null);
      toast.error("Anda tidak memiliki izin untuk menghapus role.");
      return;
    }
    if (!isValidEntityId(selectedRole.id) || selectedRole.is_system !== false) {
      setSelectedRole(null);
      toast.error("Role tidak valid atau merupakan system Role yang tidak dapat dihapus."); return;
    }
    deleting.current = true;
    try {
      await deleteRoleMutation.mutateAsync({ id: selectedRole.id, is_system: selectedRole.is_system });
      if (mounted.current && isCurrentSession(context)) setSelectedRole(null);
    } catch (error: unknown) {
      // The hook owns feedback, including when profile verification unmounts this page.
      if (mounted.current && isCurrentSession(context) && axios.isAxiosError(error) && error.response?.status === 404) setSelectedRole(null);
    } finally { deleting.current = false; }
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
      deleting: deleteRoleMutation.isPending,
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
        open={!!selectedRole && selectedRole.sessionId === captureSession().id && access.can(ACCESS.roleDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting.current && !deleteRoleMutation.isPending) setSelectedRole(null);
        }}
        title="Hapus Role?"
        description={`Apakah Anda yakin ingin menghapus role "${selectedRole?.name ?? ""}"?`}
        confirmText="Hapus"
        cancelText="Tidak"
        loadingText="Menghapus..."
        closeOnConfirm={false}
        onConfirm={() => { void confirmDelete(); }}
        loading={deleteRoleMutation.isPending}
      />
    </>
  );
  
}
