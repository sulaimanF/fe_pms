"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTablesActions } from "@/components/tables/index"
import type { OrganizationUnit } from "@/types/organizationUnit"

export const columns = (canEdit: boolean): ColumnDef<OrganizationUnit>[] => [
  {
    accessorKey: "name",
    header: "Nama",
    size: 250,
  },
  {
    accessorKey: "city",
    header: "Kota",
    size: 250,
  },
  {
    accessorKey: "jumlah_kc",
    header: "Jumlah KC",
    size: 250,
  },
  {
    accessorKey: "jumlah_kcp",
    header: "Jumlah KCP",
    size: 250,
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    size: 150,
    cell: ({ row }) => (
      <DataTablesActions
        variant="inline"
        row={row.original}
        editHref={
          canEdit
            ? `/outletManagement/organization/update/${row.original.id}`
            : undefined
        }
      />
    ),
  },
];
