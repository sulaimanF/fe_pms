import type { UserAssignedOutlet } from "@/types/userManagement";

// Missing pivot metadata follows the existing form behavior; it is not proof of revocation.
// This only filters assignment revocation, never the active status of the Outlet entity.
export function getUnrevokedUserOutlets(outlets: readonly UserAssignedOutlet[] | null | undefined): UserAssignedOutlet[] {
  return (outlets ?? []).filter((outlet) => outlet.pivot?.revoked_at == null);
}
