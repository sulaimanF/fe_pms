"use client";
import { AccessGuard, AccessDenied } from "@/components/auth/AccessGuard";
import { useParameterAccess } from "@/hooks/useParameterAccess";

function RoleBoundary({ children }: { children: React.ReactNode }) {
  const access = useParameterAccess();
  return access.allowed ? children : <AccessDenied message="Parameter Penilaian hanya tersedia untuk Super Admin dengan assignment yang valid." />;
}
export default function ParameterAccessGuard({ children }: { children: React.ReactNode }) {
  return <AccessGuard><RoleBoundary>{children}</RoleBoundary></AccessGuard>;
}

