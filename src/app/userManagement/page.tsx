"use client";

import { DataTables, DataTablesSearch } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteUser, useUsers } from "@/hooks/useUsers";
import Loading from "./loading";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import { ACCESS, canAccess, isForbidden } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import ConfirmDialogs from "@/components/dialogs/ConfirmDialogs";
import { useAppSelector } from "@/store/hooks";
import { captureSession, isCurrentSession } from "@/lib/session";
import { isValidEntityId } from "@/lib/managementApi";
import { UserDeleteResponseError } from "@/services/userManagement.services";
import type { UserManagement } from "@/types/userManagement";
import UserPermissionsDialog from "@/components/user/UserPermissionsDialog";

export default function UserManagementPage() {
  return <AccessGuard permissions={ACCESS.userList}><UserManagementContent /></AccessGuard>;
}

function UserManagementContent() {
  const access = useAuthorization();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const [selectedUser, setSelectedUser] = useState<(Pick<UserManagement, "id" | "username"> & { sessionId: number }) | null>(null);
  const [permissionUser, setPermissionUser] = useState<(Pick<UserManagement, "id" | "username"> & { sessionId: number }) | null>(null);
  const deleteMutation = useDeleteUser();
  const deleting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const handlePermissions = (user: UserManagement) => {
    if (!canAccess(ACCESS.userDetail) || !canAccess(ACCESS.userManagePermissions)) {
      toast.error("Akses permission khusus memerlukan user.view dan user.managePermission."); return;
    }
    if (!isValidEntityId(user.id) || currentUserId === undefined || user.id === currentUserId) {
      toast.error("Target tidak valid atau merupakan akun Anda sendiri."); return;
    }
    setPermissionUser({ id: user.id, username: user.username, sessionId: captureSession().id });
  };
  const handleDelete = (user: UserManagement) => {
    if (deleteMutation.isPending) return;
    if (!canAccess(ACCESS.userDelete)) {
      toast.error("Anda tidak memiliki izin untuk menghapus user."); return;
    }
    if (!isValidEntityId(user.id) || user.id === currentUserId) {
      toast.error("User tidak valid atau merupakan akun Anda sendiri."); return;
    }
    setSelectedUser({ id: user.id, username: user.username, sessionId: captureSession().id });
  };
  const confirmDelete = async () => {
    if (!selectedUser || deleting.current || deleteMutation.isPending) return;
    const context = captureSession();
    if (!isCurrentSession(context) || context.id !== selectedUser.sessionId) return;
    if (!canAccess(ACCESS.userDelete)) {
      setSelectedUser(null);
      toast.error("Anda tidak memiliki izin untuk menghapus user."); return;
    }
    if (selectedUser.id === currentUserId) {
      setSelectedUser(null);
      toast.error("Anda tidak dapat menghapus akun sendiri."); return;
    }
    deleting.current = true;
    try {
      const response = await deleteMutation.mutateAsync(selectedUser.id);
      if (!mounted.current || !isCurrentSession(context)) return;
      setSelectedUser(null);
      toast.success(typeof response.message === "string" && response.message.trim()
        ? response.message.trim().slice(0, 500) : "User berhasil dihapus.");
    } catch (error: unknown) {
      if (!mounted.current || !isCurrentSession(context) || axios.isCancel(error)) return;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const body: unknown = axios.isAxiosError(error) ? error.response?.data : undefined;
      const validationMessage = status === 422 && body && typeof body === "object" && "message" in body &&
        typeof body.message === "string" ? body.message.trim().slice(0, 500) : undefined;
      const message = isForbidden(error) ? "Akses ditolak. Anda tidak memiliki izin untuk menghapus user." :
        status === 404 ? "User sudah tidak tersedia. Daftar user dimuat ulang." :
        status === 422 ? validationMessage || "Penghapusan user ditolak oleh server." :
        status === 401 ? "Sesi telah berakhir. Silakan login kembali." :
        error instanceof UserDeleteResponseError ? error.message :
        "Penghapusan belum dapat dikonfirmasi. Daftar dimuat ulang; periksa sebelum mencoba lagi.";
      if (status === 404) setSelectedUser(null);
      toast.error(message);
    } finally { deleting.current = false; }
  };
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
    columns: columns(handleDelete, {
      edit: access.can(ACCESS.userUpdate), delete: access.can(ACCESS.userDelete),
      permissions: access.can(ACCESS.userDetail) && access.can(ACCESS.userManagePermissions),
    }, currentUserId, handlePermissions),
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    if (isForbidden(error)) return <AccessDenied />;
    return <div>Terjadi kesalahan.</div>;
  }

  return (
    <>
    <DataTables
      table={table}
      title="User Management"
      description="Manage user data"
      headerClassName="bg-blue-600 text-white"
      actions={
        access.can(ACCESS.userCreate) && <Button
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
    {permissionUser && permissionUser.sessionId === captureSession().id && access.can(ACCESS.userDetail) && access.can(ACCESS.userManagePermissions) && (
      <UserPermissionsDialog key={`${permissionUser.sessionId}:${permissionUser.id}`} user={permissionUser} onClose={() => setPermissionUser(null)} />
    )}
    <ConfirmDialogs
      open={!!selectedUser && selectedUser.sessionId === captureSession().id && access.can(ACCESS.userDelete)}
      onOpenChange={(open) => {
        if (!open && !deleting.current && !deleteMutation.isPending) setSelectedUser(null);
      }}
      title="Hapus User?"
      description={`Apakah Anda yakin ingin menghapus user "${selectedUser?.username ?? ""}"?`}
      confirmText="Hapus"
      cancelText="Tidak"
      loadingText="Menghapus..."
      closeOnConfirm={false}
      onConfirm={() => { void confirmDelete(); }}
      loading={deleteMutation.isPending}
    />
    </>
  );
}
