"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FormSkeleton from "@/components/skeletons/FormSkeleton";
import { useAuthorization } from "@/hooks/useAuthorization";
import { getRoutePermissions } from "@/lib/authorization";
import type { AccessRequirement } from "@/lib/authorization";
import { verifySession } from "@/lib/sessionVerification";
import { endSession } from "@/lib/sessionLifecycle";

export function AccessDenied({ message = "Anda tidak memiliki izin untuk mengakses halaman atau data ini." }: { message?: string }) {
  return <div role="alert" className="space-y-2 p-6"><h1 className="text-xl font-semibold">Akses ditolak</h1><p>{message}</p></div>;
}

export function AccessGuard({ children, permissions = [] }: { children: React.ReactNode; permissions?: AccessRequirement }) {
  const router = useRouter();
  const access = useAuthorization(permissions);
  useEffect(() => {
    if (access.status === "invalid") router.replace("/login");
  }, [access.status, router]);

  if (access.status === "failed") {
    return (
      <div role="alert" className="space-y-4 p-6">
        <p>{access.failure === "forbidden" ? "Verifikasi sesi ditolak oleh server." : "Sesi belum dapat diverifikasi. Periksa koneksi lalu coba lagi."}</p>
        <div className="flex gap-3">
          <Button onClick={() => { void verifySession(); }}>Coba lagi</Button>
          <Button variant="outline" onClick={() => { void endSession({ reason: "external" }); }}>Login ulang</Button>
        </div>
      </div>
    );
  }
  if (access.status !== "valid") {
    return <div role="status" aria-busy="true" className="p-6"><p className="mb-4">Memverifikasi sesi...</p><FormSkeleton /></div>;
  }
  if (!access.allowed) return <AccessDenied />;
  return <>{children}</>;
}

export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const permissions = getRoutePermissions(usePathname());
  return <AccessGuard permissions={permissions ?? []}>{permissions ? children : <AccessDenied />}</AccessGuard>;
}
