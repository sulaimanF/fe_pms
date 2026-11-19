"use client";

import { useEffect, useReducer } from "react";
import { useAuthorization } from "@/hooks/useAuthorization";
import {
  canManageParameters,
  parameterRoleExpiresAt,
} from "@/lib/parameterAuthorization";

export function useParameterAccess() {
  const access = useAuthorization();
  const [tick, refresh] = useReducer((value: number) => value + 1, 0);
  const expiresAt = access.allowed ? parameterRoleExpiresAt() : Infinity;
  useEffect(() => {
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return;
    const timer = setTimeout(
      refresh,
      Math.min(expiresAt - Date.now() + 1, 2_147_483_647),
    );
    return () => clearTimeout(timer);
  }, [expiresAt, tick]);
  return { ...access, allowed: access.allowed && canManageParameters() };
}
