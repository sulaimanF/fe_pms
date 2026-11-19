"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Award,
  Building2,
  Clipboard,
  Contact,
  FileEdit,
  FileText,
  Landmark,
  User,
} from "lucide-react";
import type { AuditLog } from "@/types/auditTrail";
import {
  auditChange,
  auditResource,
  auditValueText,
  formatAuditTimestamp,
} from "@/lib/auditTrail";
import AuditTextCell from "@/components/audit/AuditTextCell";

const resourceIcons = {
  User,
  Role: Contact,
  Outlet: Building2,
  OrganizationUnit: Landmark,
  SurveyModule: Clipboard,
  ParameterSection: Award,
  Question: FileEdit,
  ScoringMethod: Award,
};
interface Actions {
  canViewDetail: boolean;
  onDetail: (row: AuditLog) => void;
  onValue: (label: string, text: string) => void;
}
export function auditColumns({
  canViewDetail,
  onDetail,
  onValue,
}: Actions): ColumnDef<AuditLog>[] {
  return [
    {
      id: "timestamp",
      header: "Timestamp",
      accessorKey: "created_at",
      size: 210,
      cell: ({ row }) => {
        const value = formatAuditTimestamp(row.original.created_at);
        return (
          <div className="space-y-1">
            <AuditTextCell
              value={value}
              label="Timestamp"
              onExpand={() => onValue("Timestamp", value)}
            />
            {canViewDetail && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2"
                onClick={() => onDetail(row.original)}
              >
                Detail log
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: "author",
      header: "Author",
      accessorKey: "author",
      size: 180,
      cell: ({ row }) => (
        <AuditTextCell
          value={row.original.author}
          label="Author"
          onExpand={() => onValue("Author", row.original.author)}
        />
      ),
    },
    {
      id: "change",
      header: "Change",
      accessorFn: auditChange,
      size: 220,
      cell: ({ row }) => (
        <AuditTextCell
          value={auditChange(row.original)}
          label="Change"
          onExpand={() => onValue("Change", auditChange(row.original))}
        />
      ),
    },
    {
      id: "resource",
      header: "Resource",
      accessorFn: auditResource,
      size: 220,
      cell: ({ row }) => {
        const type = row.original.resource_type,
          Icon =
            type && Object.prototype.hasOwnProperty.call(resourceIcons, type)
              ? resourceIcons[type as keyof typeof resourceIcons]
              : FileText;
        return (
          <div className="flex items-center gap-2">
            <Icon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <AuditTextCell
              value={auditResource(row.original)}
              label="Resource"
              onExpand={() => onValue("Resource", auditResource(row.original))}
            />
          </div>
        );
      },
    },
    {
      id: "message",
      header: "Message",
      accessorFn: (row) => row.message ?? "",
      size: 260,
      cell: ({ row }) => (
        <AuditTextCell
          value={row.original.message ?? "—"}
          label="Message"
          onExpand={() =>
            onValue(
              "Message" +
                (row.original.message_source
                  ? " (" + row.original.message_source + ")"
                  : ""),
              row.original.message ?? "Pesan tidak dicatat oleh backend.",
            )
          }
        />
      ),
    },
    {
      id: "newValue",
      header: "New value",
      accessorFn: (row) => auditValueText(row.new_data),
      size: 300,
      cell: ({ row }) => (
        <AuditTextCell
          value={auditValueText(row.original.new_data)}
          label="New value"
          mono
          onExpand={() =>
            onValue("New value", auditValueText(row.original.new_data))
          }
        />
      ),
    },
  ];
}
