"use client";

import { Fragment, useEffect, useSyncExternalStore } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";
import {
  captureSession, getSessionSnapshot, initializeSession, isCurrentSession,
  readStoredToken, subscribeSessionEvents,
  getServerSessionSnapshot, subscribeSession,
} from "@/lib/session";
import { endSession } from "@/lib/sessionLifecycle";
import { getMe } from "@/services/auth.services";
import { prepareSession, setAuthData } from "./slices/authSlice";
import { store, persistor } from "./store";

function SessionBoundary({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);

  useEffect(() => {
    let active = true;
    let version = 0;
    const unsubscribe = subscribeSessionEvents((event) => {
      if (event.type === "unauthorized") {
        if (isCurrentSession(event.context)) {
          void endSession({ reason: "expired", context: event.context });
        }
      } else if (event.id === getSessionSnapshot().id) {
        if (event.type === "ended") {
          router.replace("/login");
          if (!event.storageCleared) toast.warning("Sesi lokal berakhir, tetapi penyimpanan sesi gagal dibersihkan.");
          else if (event.reason === "expired") toast.warning("Sesi telah berakhir. Silakan login kembali.");
        } else {
          toast.warning("Anda sudah logout lokal. Pencabutan token di server belum dapat dipastikan.");
        }
      }
    });

    const synchronize = async (external = false) => {
      const ownVersion = ++version;
      const previous = captureSession();
      if (external && getSessionSnapshot().ready) {
        await endSession({ reason: "external", context: previous });
      }
      if (!active || ownVersion !== version) return;
      const context = !getSessionSnapshot().ready || external
        ? initializeSession(readStoredToken()) : captureSession();
      const auth = store.getState().auth;
      if (auth.isAuthenticated && auth.token === context.token && context.token) return;
      if (!context.token) {
        if (auth.reference && !auth.isAuthenticated && !auth.token) {
          store.dispatch(prepareSession());
          return;
        }
        if (auth.isAuthenticated || auth.token || auth.user || auth.roles.length || auth.permissions.length || auth.menu.length) {
          await endSession({ reason: "external", context });
        }
        return;
      }
      // A different tab's token must never be paired with this tab's old profile.
      store.dispatch(prepareSession());
      try {
        const me = await getMe();
        if (!active || ownVersion !== version || !isCurrentSession(context)) return;
        store.dispatch(setAuthData({
          token: context.token,
          token_type: localStorage.getItem("token_type") ?? "Bearer",
          ...me.data,
        }));
      } catch {
        if (active && ownVersion === version && isCurrentSession(context)) {
          toast.warning("Data sesi belum dapat dimuat. Silakan coba login kembali.");
        }
      }
    };
    // Preserve an already hydrated session and valid pending OTP on first mount.
    void synchronize();

    const onStorage = (event: StorageEvent) => {
      if ((event.key === "token" || event.key === null) && readStoredToken() !== captureSession().token) {
        void synchronize(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      version++;
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, [router]);

  // Discard private form/observer state on a boundary; keep an ongoing OTP mounted.
  const boundaryKey = pathname === "/login" || pathname === "/otp" || pathname === "/"
    ? "auth" : session.id;
  if (!session.ready) return null;
  return <Fragment key={boundaryKey}>{children}</Fragment>;
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <SessionBoundary>{children}</SessionBoundary>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
