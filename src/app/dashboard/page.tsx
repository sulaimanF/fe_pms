"use client";

import { useAppSelector } from "@/store/hooks";
import { AccessGuard } from "@/components/auth/AccessGuard";
import { ACCESS } from "@/lib/authorization";

export default function DashboardPage() {
  return <AccessGuard permissions={ACCESS.dashboard}><DashboardContent /></AccessGuard>;
}

function DashboardContent() {
  
  const user = useAppSelector(
    (state) => state.auth.user
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <div className="mt-4 rounded-lg border p-4">
        <p>Login berhasil 🎉</p>

        {/* <p>Username: {user?.username}</p> */}
        <p>Username: {user?.username ?? "-"}</p>

        <p>Role: {user?.roles?.[0]?.name ?? "-"}</p>
      </div>
    </div>
  );
}
