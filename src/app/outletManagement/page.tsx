import { WilayahTable } from "./wilayah";
import { KcpTable } from "./kcp";
import { KcTable } from "./kc";

export default function OutletManagementPage() {
  return (
    <div className="space-y-8">
      <WilayahTable />

      <KcTable />

      <KcpTable />
    </div>
  );
}