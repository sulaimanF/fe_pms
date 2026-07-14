"use client";

import { DataTables, DataTablesColumnToggle } from "@/components/tables/index";
import { Button } from "@/components/ui/button";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import { auditData } from "./data";

export default function AuditTrailPage() {
  const {
    table,
  } = useDataTable({
    data: auditData,
    columns,
  });

  return (
    <DataTables
      table={table}
      headerClassName="bg-[#f3f3f3]"
      title="Audit Trail"
      description="Manage audit trail"
      toolbar={
        <div className="flex items-center justify-between w-full">

          <DataTablesColumnToggle table={table} />

          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Download Data
            </Button>
          </div>
        </div>
      }
    />
  );
}