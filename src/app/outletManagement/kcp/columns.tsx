"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTablesActions } from "@/components/tables";

export type Kcp = {
  name: string;
  kantorWilayah: string;
  kc: string;
};

export const columns: ColumnDef<Kcp>[] = [
  {
    accessorKey: "name",
    header: "Nama",
    size: 250,
  },
  {
    accessorKey: "kantorWilayah",
    header: "Kantor Wilayah",
    size: 250,
  },
  {
    accessorKey: "kc",
    header: "KC",
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