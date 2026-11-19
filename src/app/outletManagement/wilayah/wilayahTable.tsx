"use client";

import { DataTables } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import type { OrganizationUnit } from "@/types/organizationUnit";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS } from "@/lib/authorization";
// import { kantorWilayah } from "./data";

interface WilayahTableProps {
  data: OrganizationUnit[];
}

export default function WilayahTable({ data }: WilayahTableProps) {
  const access=useAuthorization();
  const { table } = useDataTable({
    data,
    columns:columns(access.can(ACCESS.organizationUpdate)),
  });

  return <DataTables table={table} title="Kantor Wilayah" />;
}
