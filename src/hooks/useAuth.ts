import { useSyncExternalStore } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { endSession } from "@/lib/sessionLifecycle";
import { captureSession, getSessionSnapshot, getServerSessionSnapshot, subscribeSession } from "@/lib/session";
import { useAppSelector } from "@/store/hooks";

export function useSessionQuery() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
  const authenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const token = useAppSelector((state) => state.auth.token);
  return {
    id: session.id,
    enabled: authenticated && !!token && token === captureSession().token && session.ready && !session.ending,
    meta: { scope: "session", sessionId: session.id },
    retry: (count: number, error: unknown) => !axios.isCancel(error) &&
      !(axios.isAxiosError(error) && error.response?.status === 401) && count < 1,
  };
}

export const useLogout = () => {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
  const mutation = useMutation({
    mutationFn: () => endSession(),
    meta: { scope: "global" }, // Only a credential-free transition result is cached.
    gcTime: 0,
    retry: false,
  });
  return { ...mutation, isPending: mutation.isPending || session.ending };
};
