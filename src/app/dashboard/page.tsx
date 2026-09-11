"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

export default function DashboardPage() {
  
  const router = useRouter();
  const user = useSelector(
    (state: RootState) => state.auth.user
  );
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

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