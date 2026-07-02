"use client";

import { ColumnDef } from "@tanstack/react-table";

export type UserManagement = {
  loginID: string;
  email: string;
  role: string;
  kantorWilayah: string;
  outlate: string;
};

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<UserManagement>[] = [
  {
    accessorKey: "loginID",
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
  },
  {
    accessorKey: "outlate",
    header: "Outlate",
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
      <Pencil className="h-4 w-4" />
    </Button>
    ),
  }
];