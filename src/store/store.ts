import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { getEndingToken, getSessionSnapshot, readStoredToken } from "@/lib/session";

interface PersistedAuth {
  token: string | null;
  reference: string | null;
}

function readPersistedAuth(value: string): PersistedAuth {
  const root = JSON.parse(value);
  return JSON.parse(root.auth);
}

const sessionStorage = {
  ...storage,
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined" && key === "persist:root") {
      try {
        const next = readPersistedAuth(value);
        // A queued write from account A cannot overwrite account B's auth.
        if (next.token !== readStoredToken()) return Promise.resolve();
        const existing = localStorage.getItem(key);
        if (getSessionSnapshot().ending && existing && readPersistedAuth(existing).token !== getEndingToken()) {
          return Promise.resolve();
        }
      } catch {
        return Promise.reject(new Error("Cannot persist authentication state."));
      }
    }
    return storage.setItem(key, value);
  },
};

const rootReducer = combineReducers({
  auth: authReducer,
});

const persistConfig = {
  key: "root",
  storage: sessionStorage,
  whitelist: ["auth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/FLUSH",
        ],
      },
    }),
});

export const persistor = persistStore(store);

export async function clearPersistedSession(owner: PersistedAuth): Promise<boolean> {
  try {
    await persistor.flush();
    const currentToken = readStoredToken();
    if (currentToken !== null && currentToken !== owner.token) return true;
    const value = localStorage.getItem("persist:root");
    if (!value) return true;
    const persisted = readPersistedAuth(value);
    if (persisted.token !== null && persisted.token !== owner.token) return true;
    if (persisted.reference !== null && persisted.reference !== owner.reference) return true;
    const root = JSON.parse(value);
    // Preserve unrelated persisted slices if the whitelist grows later.
    root.auth = JSON.stringify(authReducer(undefined, { type: "@@session/reset" }));
    localStorage.setItem("persist:root", JSON.stringify(root));
    return true;
  } catch {
    return false;
  }
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
