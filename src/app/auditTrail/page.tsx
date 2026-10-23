"use client";

import { DataTables, DataTablesColumnToggle } from "@/components/tables/index";
import { Button } from "@/components/ui/button";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";

export default function AuditTrailPage() {
  const {
    table,
  } = useDataTable({
    data: [],
    columns,
  });

  return (
    <div className="space-y-4">
    <p role="status">Audit Trail dan download belum tersedia. Data contoh tidak ditampilkan sebagai audit nyata.</p>
    <DataTables
      table={table}
      headerClassName="bg-[#f3f3f3]"
      title="Audit Trail"
      description="Integrasi API Audit Trail belum tersedia"
      toolbar={
        <div className="flex items-center justify-between w-full">

          <DataTablesColumnToggle table={table} />

          <div className="flex items-center gap-2">
            <Button disabled title="Download belum tersedia" className="bg-blue-600 hover:bg-blue-700">
              Download Data
            </Button>
          </div>
        </div>
      }
    />
    </div>
  );
}
