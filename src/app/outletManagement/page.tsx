"use client";

import { WilayahTable } from "./wilayah";
import { KcpTable } from "./kcp";
import { KcTable } from "./kc";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Link } from "lucide-react";

export default function OutletManagementPage() {

  const router = useRouter();

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
      <WilayahTable />
      <KcTable />
      <KcpTable />
    </div>
  );
}