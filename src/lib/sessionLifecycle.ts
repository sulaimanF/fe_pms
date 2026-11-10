import axios from "axios";
import { cancelSessionQueries, removeSessionCache } from "@/lib/queryClient";
import {
  beginSessionEnd, captureSession, emitSessionEvent, finishSessionEnd,
  getSessionSnapshot, initializeSession, isCurrentSession, readStoredToken,
  startLogout, finishLogout,
} from "@/lib/session";
import type { LogoutOutcome, RevocationReason, SessionContext, SessionEndReason } from "@/lib/session";
import { logout as revokeToken } from "@/services/auth.services";
import { logout, prepareSession } from "@/store/slices/authSlice";
import { clearPersistedSession, store } from "@/store/store";
import { logAuthRequestError } from "@/lib/authErrorLogging";

interface EndSessionOptions {
  reason?: SessionEndReason;
  context?: SessionContext;
  // Only used when accepting an OTP credential failed before session initialization.
  rollbackToken?: string;
}

interface EndSessionResult {
  id: number;
  storageCleared: boolean;
}

let cleanup: Promise<EndSessionResult> | null = null;
let cleanupOwnerId: number | null = null;
let cleanupTransitionId: number | null = null;
const revocations = new Map<string, Promise<LogoutOutcome>>();

function canRetryRevocation(error: unknown) {
  if (!axios.isAxiosError(error) || axios.isCancel(error)) return false;
  const status = error.response?.status;
  return status === 502 || status === 503 || status === 504 ||
    (!error.response && ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].includes(error.code ?? ""));
}

function revokeSessionToken(credential: string, reason: RevocationReason, id: number): Promise<LogoutOutcome> {
  if (!credential || (reason === "login-rollback" && captureSession().token === credential && getSessionSnapshot().status === "valid")) {
    return Promise.resolve({ status: "local" });
  }
  const existing = revocations.get(credential);
  if (existing) return existing;
  const notify = (status: "pending" | "confirmed" | "unconfirmed", message?: string) => {
    if (getSessionSnapshot().id === id) emitSessionEvent({ type: "revocation-result", id, reason, status, ...(message ? { message } : {}) });
  };
  const request = (async (): Promise<LogoutOutcome> => {
    notify("pending");
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await revokeToken(credential);
        const message = reason === "logout" && typeof response.message === "string"
          ? response.message.trim().slice(0, 500) : undefined;
        notify("confirmed", message);
        return { status: "confirmed", ...(message ? { message } : {}) };
      } catch (error: unknown) {
        if (attempt === 0 && canRetryRevocation(error)) {
          await new Promise<void>((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        if (getSessionSnapshot().id === id) {
          logAuthRequestError(reason === "logout" ? "logout-revocation" : "login-rollback-revocation", error);
        }
        notify("unconfirmed");
        return { status: "unconfirmed" };
      }
    }
    return { status: "unconfirmed" };
  })().finally(() => { revocations.delete(credential); });
  revocations.set(credential, request);
  return request;
}

// Revoke a received but unadopted OTP token without touching another session.
export function revokeLoginAttempt(credential: string, id: number) {
  return revokeSessionToken(credential, "login-rollback", id);
}

export function endSession({ reason = "logout", context = captureSession(), rollbackToken }: EndSessionOptions = {}): Promise<EndSessionResult | null> {
  const credential = reason === "login-rollback" ? rollbackToken ?? context.token : context.token;
  const revoke = ({ id, storageCleared }: EndSessionResult) => {
    if (credential && (reason === "logout" || reason === "login-rollback")) {
      const request = revokeSessionToken(credential, reason, id);
      if (reason === "logout") void request.then((outcome) => finishLogout(id, outcome, storageCleared));
    } else if (reason === "logout") {
      finishLogout(id, { status: "local" }, storageCleared);
    }
  };
  if (reason === "login-rollback" && credential === captureSession().token && getSessionSnapshot().status === "valid") {
    return Promise.resolve(null);
  }
  // Header/sidebar may submit together. Do not create another transition during revocation.
  if (reason === "logout" && context.id === getSessionSnapshot().id && getSessionSnapshot().logout) {
    return cleanup ?? Promise.resolve(null);
  }
  if (cleanup) {
    if (context.id !== cleanupOwnerId && context.id !== cleanupTransitionId) {
      if (context.id === getSessionSnapshot().id) {
        return cleanup.then(() => endSession({ reason, context, rollbackToken }));
      }
      if (reason === "login-rollback" && credential) void revokeLoginAttempt(credential, context.id);
      return Promise.resolve(null);
    }
    // Preserve a rollback/revocation request that joins an ongoing local cleanup.
    if (reason === "logout" && cleanupTransitionId !== null) startLogout(cleanupTransitionId);
    void cleanup.then(revoke);
    return cleanup;
  }
  if (context.id !== getSessionSnapshot().id) {
    if (reason === "login-rollback" && credential) void revokeLoginAttempt(credential, context.id);
    return Promise.resolve(null);
  }

  const owner = { token: context.token ?? store.getState().auth.token, reference: store.getState().auth.reference };
  const transition = beginSessionEnd(reason);
  cleanupOwnerId = context.id;
  cleanupTransitionId = transition.id;
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
    try { await cancelSessionQueries(context.id); } catch { storageCleared = false; }
    try { removeSessionCache(context.id); } catch { storageCleared = false; }
    storageCleared = await clearPersistedSession(owner) && storageCleared;
    finishSessionEnd(transition.id);
    if (reason !== "external" || readStoredToken() === null || !storageCleared) {
      emitSessionEvent({ type: "ended", id: transition.id, reason, storageCleared });
    }
    // Server availability never blocks cleanup or supplies credentials from a new account.
    revoke({ id: transition.id, storageCleared });
    return { id: transition.id, storageCleared };
  })().finally(() => { cleanup = null; cleanupOwnerId = null; cleanupTransitionId = null; });
  return cleanup;
}

export async function acceptSessionCredentials(context: SessionContext, credential: string, tokenType: string) {
  let transitionId = context.id;
  let adopted = false;
  let revocationHandled = false;
  try {
    if (!isCurrentSession(context)) return null;
    // Also isolates a new credential accepted without a preceding logout click.
    const transition = beginSessionEnd();
    transitionId = transition.id;
    store.dispatch(prepareSession());
    await cancelSessionQueries(context.id);
    removeSessionCache(context.id);
    await clearPersistedSession({ token: context.token, reference: store.getState().auth.reference });
    if (getSessionSnapshot().id !== transition.id || readStoredToken() !== context.token) {
      finishSessionEnd(transition.id);
      return null;
    }
    localStorage.setItem("token_type", tokenType);
    localStorage.setItem("token", credential);
    const next = initializeSession(credential);
    adopted = true;
    return next;
  } catch {
    if (getSessionSnapshot().id === transitionId) {
      const current = captureSession();
      const result = await endSession({
        reason: "login-rollback",
        context: { ...current, token: readStoredToken() === credential ? credential : current.token },
        rollbackToken: credential,
      });
      revocationHandled = !!result;
    }
    return null;
  } finally {
    if (!adopted && !revocationHandled) void revokeLoginAttempt(credential, transitionId);
  }
}
