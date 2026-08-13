"use client";

import { WilayahTable } from "./wilayah";
import { KcpTable } from "./kcp";
import { KcTable } from "./kc";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useOrganizationUnits } from "@/hooks/useOrganizationUnits";
import { useAllOutlets } from "@/hooks/useOutlets";
import { Link } from "lucide-react";

export default function OutletManagementPage() {

  const router = useRouter();
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

  console.log("OUTLETS:", outletData);
  console.log("ORGANIZATIONS:", organizationData);

  if (outletLoading || organizationLoading) {
    return <div>Loading...</div>;
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
          onClick={() => router.push("/outletManagement/create")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add New Data
        </Button>
      </div>
      <WilayahTable data={wilayah} />

      <KcTable data={cabang} />

      <KcpTable data={kcp} />
    </div>
  );
}