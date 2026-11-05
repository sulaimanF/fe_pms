"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Role } from "@/types/role";
import DataTablesActions from "@/components/tables/DataTablesActions";

export const columns = (onDelete: (role: Role) => void, access: { edit: boolean; delete: boolean; deleting: boolean }): ColumnDef<Role>[] => [
  {
    accessorKey: "name",
    header: "Role Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "users_count",
    header: "Total User",
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => (
      <DataTablesActions
        row={row.original}
        variant="inline"
        editHref={access.edit ? `/roleManagement/update/${row.original.id}` : undefined}
        onDelete={access.delete && !access.deleting && row.original.is_system === false ? () => onDelete(row.original) : undefined}
      />
    ),
  }
];
