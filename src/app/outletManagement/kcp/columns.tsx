"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTablesActions } from "@/components/tables";
import type { OutletTableRow } from "@/lib/outletManagement";

export type Kcp = OutletTableRow;
export interface OutletTableAccess {
  view: boolean;
  edit: boolean;
  delete: boolean;
  deleting: boolean;
}
export const columns = (
  onView: (outlet: OutletTableRow) => void,
  onDelete: (outlet: OutletTableRow) => void,
  access: OutletTableAccess,
): ColumnDef<OutletTableRow>[] => [
  { accessorKey: "name", header: "Nama", size: 250 },
  { accessorKey: "code", header: "Kode" },
  {
    accessorFn: (outlet) => outlet.outlet_type ?? "",
    id: "outlet_type",
    header: "Jenis",
    cell: ({ row }) => row.original.outlet_type ?? "Tidak ditentukan",
  },
  { accessorKey: "kantorWilayah", header: "Kantor Wilayah", size: 250 },
  { accessorKey: "kc", header: "KC", size: 250 },
  {
    id: "status",
    accessorFn: (outlet) => (outlet.is_active ? "Active" : "Inactive"),
    header: "Status",
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
        onView={access.view ? onView : undefined}
        editHref={
          access.edit
            ? `/outletManagement/update/${row.original.id}`
            : undefined
        }
        onDelete={access.delete && !access.deleting ? onDelete : undefined}
      />
    ),
  },
];
