"use client";

import { useSyncExternalStore } from "react";
import { useAppSelector } from "@/store/hooks";
import { captureSession, getSessionSnapshot, getServerSessionSnapshot, isCurrentSession, subscribeSession } from "@/lib/session";
import { canAccess, hasPermissions } from "@/lib/authorization";
import type { AccessRequirement } from "@/lib/authorization";

export function useAuthorization(required: AccessRequirement = []) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
  const auth = useAppSelector((state) => state.auth);
  const valid = session.status === "valid" && isCurrentSession(captureSession()) &&
    auth.isAuthenticated && !!auth.user && !!auth.token && auth.token === captureSession().token;
  return {
    status: session.status === "valid" && !valid ? "verifying" : session.status,
    failure: session.failure,
    allowed: valid && hasPermissions(auth.permissions, required),
    can: canAccess,
  };
}
