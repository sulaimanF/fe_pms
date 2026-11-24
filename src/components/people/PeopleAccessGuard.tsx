"use client";
import { AccessDenied, AccessGuard } from "@/components/auth/AccessGuard";
import { usePeopleAccess } from "@/hooks/usePeople";
function RoleBoundary({ children }: { children: React.ReactNode }) {
  const access = usePeopleAccess();
  return access.allowed ? children : <AccessDenied message="People Management sementara hanya tersedia untuk Super Admin dengan assignment aktif, tidak kedaluwarsa, dan tanpa scope." />;
}
export default function PeopleAccessGuard({ children }: { children: React.ReactNode }) {
  return <AccessGuard><RoleBoundary>{children}</RoleBoundary></AccessGuard>;
}
