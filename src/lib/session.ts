import { CanceledError } from "axios";

export interface SessionContext {
  id: number;
  token: string | null;
}

interface SessionSnapshot {
  id: number;
  ready: boolean;
  ending: boolean;
}

export type SessionEvent =
  | { type: "unauthorized"; context: SessionContext }
  | { type: "ended"; id: number; reason: "logout" | "expired" | "external"; storageCleared: boolean }
  | { type: "revocation-failed"; id: number };

const serverSnapshot: SessionSnapshot = { id: 0, ready: false, ending: false };
let snapshot = serverSnapshot;
let token: string | null = null;
let endingToken: string | null = null;
const listeners = new Set<() => void>();
const eventListeners = new Set<(event: SessionEvent) => void>();
const requests = new Map<AbortController, number>();

export function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export const getSessionSnapshot = () => snapshot;
export const getServerSessionSnapshot = () => serverSnapshot;
export const getEndingToken = () => endingToken;

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function subscribeSessionEvents(listener: (event: SessionEvent) => void) {
  eventListeners.add(listener);
  return () => { eventListeners.delete(listener); };
}

export function emitSessionEvent(event: SessionEvent) {
  eventListeners.forEach((listener) => listener(event));
}

function publish(next: SessionSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function captureSession(): SessionContext {
  return { id: snapshot.id, token };
}

export function isCurrentSession(context: SessionContext) {
  return snapshot.ready && !snapshot.ending && context.id === snapshot.id &&
    context.token === token && context.token === readStoredToken();
}

export function assertSession(id: number) {
  if (id !== snapshot.id || !isCurrentSession(captureSession())) {
    throw new CanceledError("Session ended.");
  }
}

export function initializeSession(credential: string | null) {
  token = credential;
  endingToken = null;
  publish({ id: snapshot.id + 1, ready: true, ending: false });
  return captureSession();
}

export function registerSessionRequest(controller: AbortController, id: number) {
  requests.set(controller, id);
  return () => { requests.delete(controller); };
}

export function beginSessionEnd() {
  const previous = captureSession();
  endingToken = previous.token;
  publish({ id: snapshot.id + 1, ready: true, ending: true });
  requests.forEach((id, controller) => {
    if (id === previous.id) {
      controller.abort();
      requests.delete(controller);
    }
  });
  return { previous, id: snapshot.id };
}

export function finishSessionEnd(id: number) {
  if (snapshot.id !== id) return;
  token = null;
  endingToken = null;
  publish({ ...snapshot, ending: false });
}

export async function requestInSession<T>(id: number, request: () => Promise<T>): Promise<T> {
  assertSession(id);
  const result = await request();
  assertSession(id);
  return result;
}
