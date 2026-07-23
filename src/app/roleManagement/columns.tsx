"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Role } from "@/types/role"
import DataTablesActions from "@/components/tables/DataTablesActions";

export const columns = ( onDelete: (id: number) => void): ColumnDef<Role>[] => [
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
        editHref={`/roleManagement/update/${row.original.id}`}
        onDelete={() => onDelete(row.original.id)}
      />
    ),
  }
];