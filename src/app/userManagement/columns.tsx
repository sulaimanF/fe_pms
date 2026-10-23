"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UserManagement } from "@/types/userManagement";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const columns = (canEdit: boolean): ColumnDef<UserManagement>[] => [
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
    cell: ({ row }) => canEdit ? (
      <Button
        asChild
        variant="ghost"
        size="icon"
        title="Edit User"
      >
      
        <Link href={`/userManagement/update/${row.original.id}`}>
          <Pencil className="h-4 w-4 cursor-pointer" />
        </Link>
      </Button>
    ) : null,
  }
];
