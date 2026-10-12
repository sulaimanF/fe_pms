import axios from "axios";
import { getMe } from "@/services/auth.services";
import { captureSession, isCurrentSession, setSessionStatus } from "@/lib/session";
import { endSession } from "@/lib/sessionLifecycle";
import { store } from "@/store/store";
import { prepareSession, setAuthData } from "@/store/slices/authSlice";
import type { MeResponse } from "@/types/auth";
import { isForbidden } from "@/lib/authorization";

export function isMeResponse(value: unknown): value is MeResponse {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<MeResponse>;
  return !!profile.user && typeof profile.user.id === "number" &&
    Array.isArray(profile.roles) && Array.isArray(profile.permissions) &&
    profile.permissions.every((code) => typeof code === "string") &&
    Array.isArray(profile.menu);
}

type VerificationResult = { rollbackId: number } | null;
let verification: { id: number; promise: Promise<VerificationResult> } | null = null;

export function verifySession(context = captureSession(), rollbackIncompleteLogin = false): Promise<VerificationResult> {
  if (!context.token || !isCurrentSession(context)) return Promise.resolve(null);
  if (verification?.id === context.id) return verification.promise;

  setSessionStatus(context, "verifying");
  store.dispatch(prepareSession());
  const promise = (async () => {
    try {
      const me = await getMe();
      if (!isCurrentSession(context)) return null;
      if (!isMeResponse(me.data)) throw new Error("Incomplete authentication profile.");
      store.dispatch(setAuthData({
        token: context.token!,
        token_type: localStorage.getItem("token_type") ?? "Bearer",
        ...me.data,
      }));
      setSessionStatus(context, "valid");
    } catch (error: unknown) {
      if (!isCurrentSession(context) || axios.isCancel(error)) return null;
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await endSession({ reason: "expired", context });
      } else if (rollbackIncompleteLogin) {
        // A2: a consumed OTP attempt must recover through a fresh login.
        const result = await endSession({ reason: "external", context });
        return result ? { rollbackId: result.id } : null;
      } else {
        setSessionStatus(context, "failed", isForbidden(error) ? "forbidden" : "unavailable");
      }
    }
    return null;
  })().finally(() => {
    if (verification?.id === context.id) verification = null;
  });
  verification = { id: context.id, promise };
  return promise;
}
