import { store } from "@/store/store";
import { ACCESS, AccessDeniedError, canAccess } from "@/lib/authorization";
import { assertSession } from "@/lib/session";

// /auth/me supplies this code. canManageBypass() verifies the actor's active,
// unscoped, unexpired super-admin assignment and is not granted by is_bypass.
export function parameterRoleExpiresAt() {
  const source = store.getState().auth.user?.roles;
  const roles = Array.isArray(source) ? source : [];
  const expiries = roles
    .filter(
      (role) =>
        role &&
        role.code === "super-admin" &&
        role.is_active === true &&
        role.pivot?.is_active === true &&
        role.pivot.scope_type === null &&
        role.pivot.scope_id === null,
    )
    .map((role) => {
      const value = role.pivot?.expires_at;
      if (value == null) return Infinity;
      const timestamp = Date.parse(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
          ? value.replace(" ", "T") + "+07:00"
          : value,
      );
      return Number.isFinite(timestamp) ? timestamp : -Infinity;
    });
  return expiries.length ? Math.max(...expiries) : -Infinity;
}
export function canManageParameters() {
  const auth = store.getState().auth;
  return (
    canAccess(ACCESS.dashboard) &&
    auth.user?.is_active === true &&
    auth.capabilities?.can_manage_user_bypass === true &&
    auth.roles.some((role) => role.code === "super-admin") &&
    parameterRoleExpiresAt() > Date.now()
  );
}
export function assertParameterAccess(sessionId: number) {
  assertSession(sessionId);
  if (!canManageParameters()) throw new AccessDeniedError();
}
export const isParameterPath = (path: string) =>
  typeof path === "string" &&
  (path === "/parameterPenilaian" || path.startsWith("/parameterPenilaian/"));
