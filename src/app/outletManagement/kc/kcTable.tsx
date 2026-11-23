"use client";

import { DataTables } from "@/components/tables/index";
import { useDataTable } from "@/hooks/useDataTable";
import { columns } from "./columns";
import type { OrganizationUnit } from "@/types/organizationUnit";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS } from "@/lib/authorization";

interface KcTableProps {
  data: OrganizationUnit[];
  organizations: readonly OrganizationUnit[];
}

export default function KcTable({ data, organizations }: KcTableProps) {
  const access = useAuthorization();
  const { table } = useDataTable({
    data,
    columns: columns(organizations, access.can(ACCESS.organizationUpdate)),
  });

  return <DataTables table={table} title="Kantor Cabang" />;
}
