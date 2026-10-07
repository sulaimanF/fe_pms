import axios, { CanceledError } from "axios";
import { captureSession, emitSessionEvent, isCurrentSession, registerSessionRequest } from "@/lib/session";
import type { SessionContext } from "@/lib/session";

declare module "axios" {
  interface AxiosRequestConfig {
    sessionMode?: "global" | "revoke";
    sessionContext?: SessionContext;
    releaseSessionRequest?: () => void;
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "X-Code-Key": process.env.NEXT_PUBLIC_X_CODE_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const publicAuthPaths = new Set([
  "/auth/login", "/auth/login/verify-otp", "/auth/otp/verify", "/auth/otp/resend",
]);

api.interceptors.request.use((config) => {
  if (typeof window === "undefined" || config.sessionMode === "global") return config;
  if (config.sessionMode === "revoke") {
    // Captured logout credentials must never be replaced by the next account's token.
    if (config.url !== "/auth/logout" || !config.headers.Authorization) {
      throw new CanceledError("Invalid revocation request.");
    }
    return config;
  }
  const context = config.sessionContext ?? captureSession();
  if (!isCurrentSession(context) || (!publicAuthPaths.has(config.url ?? "") && !context.token)) {
    throw new CanceledError("Session ended.");
  }
  config.sessionContext = context;
  if (context.token) config.headers.Authorization = `Bearer ${context.token}`;
  else config.headers.delete("Authorization");

  const controller = new AbortController();
  const callerSignal = config.signal;
  const abort = () => controller.abort();
  if (callerSignal?.aborted) controller.abort();
  else callerSignal?.addEventListener?.("abort", abort, { once: true });
  const unregister = registerSessionRequest(controller, context.id);
  config.signal = controller.signal;
  config.releaseSessionRequest = () => {
    unregister();
    callerSignal?.removeEventListener?.("abort", abort);
  };
  return config;
}, (error: unknown) => { throw error; }, { synchronous: true });

api.interceptors.response.use((response) => {
  const config = response.config;
  config.releaseSessionRequest?.();
  if (config.sessionContext && !isCurrentSession(config.sessionContext)) {
    throw new CanceledError("Session ended.");
  }
  return response;
}, (error: unknown) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error);
  const config = error.config;
  config?.releaseSessionRequest?.();
  const context = config?.sessionContext;
  if (context && !isCurrentSession(context)) return Promise.reject(new CanceledError("Session ended."));
  if (context?.token && error.response?.status === 401 && !publicAuthPaths.has(config?.url ?? "")) {
    emitSessionEvent({ type: "unauthorized", context });
  }
  return Promise.reject(error);
});

export default api;
