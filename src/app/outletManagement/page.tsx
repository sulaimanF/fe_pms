"use client";

import { WilayahTable } from "./wilayah";
import { KcpTable } from "./kcp";
import { KcTable } from "./kc";
import { Button } from "@/components/ui/button";
import { useOrganizationUnits } from "@/hooks/useOrganizationUnits";
import { useAllOutlets } from "@/hooks/useOutlets";
import OutletManagementSkeleton from "@/components/skeletons/TableSkeleton";
import { Plus } from "lucide-react";

export default function OutletManagementPage() {

  const {
    data: outletData,
    isLoading: outletLoading,
    isError: outletError,
  } = useAllOutlets();

  const {
    data: organizationData,
    isLoading: organizationLoading,
    isError: organizationError,
  } = useOrganizationUnits();


  if (outletLoading || organizationLoading) {
    return <OutletManagementSkeleton />;
  }

  if (outletError || organizationError) {
    return <div>Failed to load data</div>;
  }

  const organizations = organizationData?.data ?? [];

  const wilayah = organizations.filter(
    (organization) => organization.unit_type === "wilayah"
  );

  const cabang = organizations.filter(
    (organization) => organization.unit_type === "cabang"
  );

  const outlets = outletData?.data ?? [];
  const kcp = outlets.map((outlet) => {
    const kc = organizations.find(
      (organization) =>
        organization.id === outlet.organization_unit_id
    );

    const wilayah = organizations.find(
      (organization) =>
        organization.id === kc?.parent_id
    );

    return {
      name: outlet.name,
      kantorWilayah: wilayah?.name ?? "-",
      kc: kc?.name ?? "-",
    };
  });
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Outlet Management</h1>
        <Button
          disabled
          title="Create Outlet belum tersedia"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <>
            <Plus className="mr-2 h-4 w-4" />
            Add Outlet
          </>
        </Button>
      </div>
      <p role="status">Create, edit, dan delete Outlet belum tersedia. Daftar di bawah berasal dari backend.</p>
      <WilayahTable data={wilayah} />

      <KcTable data={cabang} />

      <KcpTable data={kcp} />
    </div>
  );
}
