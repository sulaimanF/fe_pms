"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { UserManagement } from "@/types/userManagement";
import DataTablesActions from "@/components/tables/DataTablesActions";
import { getUnrevokedUserOutlets } from "@/lib/userAssignments";

const outletNames = (user: UserManagement) => getUnrevokedUserOutlets(user.outlets)
  .map((outlet) => outlet.name).filter((name) => typeof name === "string").join(", ");

export const columns = (
  onDelete: (user: UserManagement) => void,
  access: { edit: boolean; delete: boolean; permissions: boolean },
  currentUserId: number | undefined,
  onPermissions: (user: UserManagement) => void,
): ColumnDef<UserManagement>[] => [
  {
    accessorKey: "username",
    header: "Login ID",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "role",
    accessorFn: (user) => (user.roles ?? []).map((role) => role.name).filter((name) => typeof name === "string").join(", "),
    header: "Role",
    cell: ({ row }) =>
    (row.original.roles ?? []).map(role => role.name).join(", "),
  },
  {
    id: "kantorWilayah",
    accessorFn: (user) => user.organization_unit?.name ?? "",
    header: "Kantor Wilayah",
    cell: ({ row }) => row.original.organization_unit?.name ?? "-",
  },
  {
    id: "outlet",
    accessorFn: outletNames,
    header: "Outlet Kelolaan",
    cell: ({ row }) => outletNames(row.original),
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => (
      <DataTablesActions
        row={row.original}
        variant="inline"
        editHref={access.edit ? `/userManagement/update/${row.original.id}` : undefined}
        onDelete={access.delete && currentUserId !== undefined && row.original.id !== currentUserId ? onDelete : undefined}
        onPermissions={access.permissions && currentUserId !== undefined && row.original.id !== currentUserId ? onPermissions : undefined}
      />
    ),
  }
];
