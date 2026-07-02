"use client";

import { ColumnDef } from "@tanstack/react-table";

export type AuditTrail = {
  timestamp: string;
  author: string;
  change: string;
  resource: string;
  message: string;
  newValue: string;
};

export const columns: ColumnDef<AuditTrail>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
  },
  {
    accessorKey: "author",
    header: "Author",
  },
  {
    accessorKey: "change",
    header: "Change",
  },
  {
    accessorKey: "resource",
    header: "Resource",
  },
  {
    accessorKey: "message",
    header: "Message",
  },
  {
    accessorKey: "newValue",
    header: "New Value",
  },
];