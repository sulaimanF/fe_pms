"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { UserManagement } from "@/types/userManagement";
import DataTablesActions from "@/components/tables/DataTablesActions";

export const columns = (
  onDelete: (user: UserManagement) => void,
  access: { edit: boolean; delete: boolean },
  currentUserId: number | undefined,
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
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) =>
    (row.original.roles ?? []).map(role => role.name).join(", "),
  },
  {
    accessorKey: "kantorWilayah",
    header: "Kantor Wilayah",
    cell: ({ row }) => row.original.organization_unit?.name ?? "-",
  },
  {
    accessorKey: "outlet",
    header: "Outlet Kelolaan",
      cell: ({ row }) =>
      (row.original.outlets ?? [])
        .map(outlet => outlet.name)
        .join(", "),
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
      />
    ),
  }
];
