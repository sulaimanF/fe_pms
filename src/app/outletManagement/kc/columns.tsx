"use client";

import { ColumnDef } from "@tanstack/react-table";
import DataTablesActions from "@/components/tables/DataTablesActions";
import type { OrganizationUnit } from "@/types/organizationUnit";

export const columns: ColumnDef<OrganizationUnit>[] = [
  // {
  //   accessorKey: "name",
  //   header: "Nama",
  //   size: 250,
  // },
  // {
  //   accessorKey: "kantorWilayah",
  //   header: "Kantor Wilayah",
  //   size: 250,
  // },
  // {
  //   accessorKey: "jumlahKcp",
  //   header: "Jumlah KCP",
  //   size: 250,
  // },
  {
    accessorKey: "name",
    header: "Nama",
    size: 250,
  },
  {
    id: "kantorWilayah",
    header: "Kantor Wilayah",
    size: 250,
    cell: ({ row }) => {
      return row.original.parent?.name ?? "-";
    },
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
        onEdit={(data) => {
          console.log("Edit", data);
        }}
        onDelete={(data) => {
          console.log("Delete", data);
        }}
      />
    ),
  }
];