import { cancelSessionQueries, removeSessionCache } from "@/lib/queryClient";
import {
  beginSessionEnd, captureSession, emitSessionEvent, finishSessionEnd,
  getSessionSnapshot, initializeSession, isCurrentSession, readStoredToken,
} from "@/lib/session";
import type { SessionContext } from "@/lib/session";
import { logout as revokeToken } from "@/services/auth.services";
import { logout, prepareSession } from "@/store/slices/authSlice";
import { clearPersistedSession, store } from "@/store/store";

interface EndSessionOptions {
  reason?: "logout" | "expired" | "external";
  context?: SessionContext;
}

interface EndSessionResult {
  id: number;
  storageCleared: boolean;
}

let cleanup: Promise<EndSessionResult> | null = null;

export function endSession({ reason = "logout", context = captureSession() }: EndSessionOptions = {}) {
  if (cleanup) return cleanup;
  if (context.id !== getSessionSnapshot().id) return Promise.resolve(null);

  const owner = { token: context.token ?? store.getState().auth.token, reference: store.getState().auth.reference };
  const transition = beginSessionEnd();
  // Reset synchronously; server availability never controls local termination.
  store.dispatch(logout());
  let storageCleared = true;
  try {
    if (readStoredToken() === context.token) {
      localStorage.removeItem("token");
      localStorage.removeItem("token_type");
    }
  } catch {
    storageCleared = false;
  }

  cleanup = (async () => {
    await cancelSessionQueries(context.id);
    removeSessionCache(context.id);
    storageCleared = await clearPersistedSession(owner) && storageCleared;
    finishSessionEnd(transition.id);
    if (reason !== "external" || readStoredToken() === null || !storageCleared) {
      emitSessionEvent({ type: "ended", id: transition.id, reason, storageCleared });
    }
    if (reason === "logout" && context.token) {
      // Captured credentials stay out of mutation variables/cache and persistence.
      void revokeToken(context.token).catch(() => {
        if (getSessionSnapshot().id === transition.id) {
          emitSessionEvent({ type: "revocation-failed", id: transition.id });
        }
      });
    }
    return { id: transition.id, storageCleared };
  })().finally(() => { cleanup = null; });
  return cleanup;
}

export async function acceptSessionCredentials(context: SessionContext, credential: string, tokenType: string) {
  if (!isCurrentSession(context)) return null;
  // Also isolates a new credential accepted without a preceding logout click.
  const transition = beginSessionEnd();
  store.dispatch(prepareSession());
  await cancelSessionQueries(context.id);
  removeSessionCache(context.id);
  await clearPersistedSession({ token: context.token, reference: store.getState().auth.reference });
  if (getSessionSnapshot().id !== transition.id || readStoredToken() !== context.token) {
    finishSessionEnd(transition.id);
    return null;
  }
  try {
    localStorage.setItem("token_type", tokenType);
    localStorage.setItem("token", credential);
    return initializeSession(credential);
  } catch {
    await endSession({ reason: "external" });
    return null;
  }
}
