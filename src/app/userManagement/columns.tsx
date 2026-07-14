"use client";

import { ColumnDef } from "@tanstack/react-table";

// export type UserManagement = {
//   loginID: string;
//   email: string;
//   role: string;
//   kantorWilayah: string;
//   outlate: string;
// };

import { UserManagement } from "@/types/userManagement";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const columns: ColumnDef<UserManagement>[] = [
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
  },
  {
    accessorKey: "kantorWilayah",
    header: "Kantor Wilayah",
    cell: ({ row }) => row.original.organization_unit.name,
  },
  {
    accessorKey: "outlet",
    header: "Outlet Kelolaan",
    cell: ({ row }) => row.original.organization_unit.name,
  },
  {
    id: "actions",

    header: "Actions",

    enableHiding: false,

    cell: ({ row }) => (
      <Button
      variant="ghost"
      size="icon"
      title="Edit User"
      // onClick={() => handleEdit(row.original)}
      onClick={() => {
        console.log("Edit", row.original);
      }}
    >
      
    <Link href={`/userManagement/update/${row.original.id}`}>
      <Pencil className="h-4 w-4 cursor-pointer" />
    </Link>
    </Button>
    ),
  }
];