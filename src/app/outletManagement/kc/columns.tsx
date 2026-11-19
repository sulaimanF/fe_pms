"use client";

import { ColumnDef } from "@tanstack/react-table";
import DataTablesActions from "@/components/tables/DataTablesActions";
import type { OrganizationUnit } from "@/types/organizationUnit";
import { outletHierarchy } from "@/lib/outletManagement";

export const columns = (
  organizations: readonly OrganizationUnit[],
  canEdit:boolean,
): ColumnDef<OrganizationUnit>[] => {
  const byId = new Map(
    organizations.map((organization) => [organization.id, organization]),
  );
  return [
    {
      accessorKey: "name",
      header: "Nama",
      size: 250,
    },
    {
      id: "kantorWilayah",
      accessorFn: (organization) =>
        outletHierarchy(organization.id, byId).wilayah,
      header: "Kantor Wilayah",
      size: 250,
      cell: ({ row }) => {
        return outletHierarchy(row.original.id, byId).wilayah;
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
        <DataTablesActions variant="inline" row={row.original} editHref={canEdit?`/outletManagement/organization/update/${row.original.id}`:undefined} />
      ),
    },
  ];
};
