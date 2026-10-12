import axios from "axios";
import { captureSession, getSessionSnapshot, isCurrentSession, assertSession } from "@/lib/session";
import { store } from "@/store/store";

// Verified against premises-moni-sys/routes/api/v1.php. Each array requires ALL codes.
export const ACCESS = {
  dashboard: [],
  roleList: ["role.viewAny"],
  roleDetail: ["role.view"],
  roleCreate: ["role.create"],
  roleUpdate: ["role.view", "role.update"],
  roleDelete: ["role.delete"],
  userList: ["user.viewAny"],
  userDetail: ["user.view"],
  userCreate: ["user.create"],
  userUpdate: ["user.view", "user.update"],
  permissionCatalog: ["permission.viewAny"],
} as const;

export type PermissionCode = typeof ACCESS[keyof typeof ACCESS][number];
export type AccessRequirement = readonly PermissionCode[];

export function hasPermissions(granted: readonly string[], required: AccessRequirement) {
  return required.every((code) => granted.includes(code));
}

export function canAccess(required: AccessRequirement) {
  const context = captureSession();
  const auth = store.getState().auth;
  return getSessionSnapshot().status === "valid" && isCurrentSession(context) &&
    auth.isAuthenticated && !!auth.user && !!auth.token && auth.token === context.token &&
    hasPermissions(auth.permissions, required);
}

export class AccessDeniedError extends Error {
  constructor() {
    super("Anda tidak memiliki izin untuk melakukan tindakan ini.");
    this.name = "AccessDeniedError";
  }
}

export function assertAccess(id: number, required: AccessRequirement) {
  assertSession(id);
  if (!canAccess(required)) throw new AccessDeniedError();
}

export function isForbidden(error: unknown) {
  return error instanceof AccessDeniedError ||
    (axios.isAxiosError(error) && error.response?.status === 403);
}

export function getRoutePermissions(pathname: string): AccessRequirement | null {
  // Backend menu fields may be null; only known route paths have an A3 policy.
  if (typeof pathname !== "string") return null;
  const path = pathname.replace(/\/+$/, "");
  if (path === "/dashboard") return ACCESS.dashboard;
  if (path === "/roleManagement") return ACCESS.roleList;
  if (path === "/roleManagement/create") return ACCESS.roleCreate;
  if (/^\/roleManagement\/update\/[^/]+$/.test(path)) return ACCESS.roleUpdate;
  if (path === "/userManagement") return ACCESS.userList;
  if (path === "/userManagement/create") return ACCESS.userCreate;
  if (/^\/userManagement\/update\/[^/]+$/.test(path)) return ACCESS.userUpdate;
  return null;
}
