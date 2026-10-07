import { QueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

const privateResources = new Set([
  "users", "user", "roles", "role", "permissions", "menu-tree",
  "organization-units", "outlets", "me",
]);

export const sessionQueryKey = (id: number, resource: string, ...params: unknown[]) =>
  ["session", id, resource, ...params] as const;

function belongsToSession(key: QueryKey | undefined, meta: Record<string, unknown> | undefined, id: number) {
  if (meta?.scope === "global") return false;
  if (key?.[0] === "session") return key[1] === id;
  if (meta?.sessionId === id) return true;
  // Compatibility for private keys created before the session namespace.
  return typeof key?.[0] === "string" && privateResources.has(key[0]);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 menit
    },
  },
});

export function removeSessionCache(id: number) {
  queryClient.removeQueries({ predicate: (query) => belongsToSession(query.queryKey, query.meta, id) });
  queryClient.getMutationCache().getAll().forEach((mutation) => {
    if (belongsToSession(mutation.options.mutationKey, mutation.meta, id)) {
      queryClient.getMutationCache().remove(mutation);
    }
  });
}

export function cancelSessionQueries(id: number) {
  return queryClient.cancelQueries({ predicate: (query) => belongsToSession(query.queryKey, query.meta, id) });
}
