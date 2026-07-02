"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTablesActions } from "@/components/tables/index";

export type KantorWilayah = {
  name: string;
  kota: string;
  jumlahWilayah: string;
  jumlahKcp: string;
};

export const columns: ColumnDef<KantorWilayah>[] = [
  {
    accessorKey: "name",
    header: "Nama",
    size: 250,
  },
  {
    accessorKey: "kota",
    header: "Kota",
    size: 250,
  },
  {
    accessorKey: "jumlahWilayah",
    header: "Jumlah KC",
    size: 250,
  },
  {
    accessorKey: "jumlahKcp",
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
      // <DataTablesActions
      //   row={row.original}
      //   onEdit={handleEdit}
      //   onDelete={handleDelete}
      // />
    ),
  }
];