"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Kcp = {
  name: string;
  kantorWilayah: string;
  jumlahKcp: string;
};

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          title="Edit KCP"
          // onClick={() => handleEdit(row.original)}
          onClick={() => {
            console.log("Edit", row.original);
          }}
        >
          <Pencil className="h-4 w-4 text-blue-600 transition-colors hover:text-blue-700"/>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Delete"
          onClick={() => {
            console.log("Delete", row.original);
          }}
        >
          <Trash2 className="h-4 w-4 text-red-600"/>
        </Button>
      </div>
      
    ),
  }
];