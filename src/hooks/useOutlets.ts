import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import {
  getAllOutlets,
  getOutletById,
  createOutlet,
  updateOutlet,
  deleteOutlet,
  outletWriteMatches,
} from "@/services/outlet.service";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession, assertSession } from "@/lib/session";
import { ACCESS, assertAccess, canAccess } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";
import { isValidEntityId } from "@/lib/managementApi";
import type { OutletCreateRequest, OutletUpdateRequest } from "@/types/outlet";

export const useOutlets = (organizationUnitId?: number) => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.outletList);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "outlets", organizationUnitId),
    queryFn: ({ signal }) =>
      requestInSession(session.id, () => {
        assertAccess(session.id, ACCESS.outletList);
        return getAllOutlets(organizationUnitId, signal);
      }),
    enabled:
      session.enabled && access.allowed && isValidEntityId(organizationUnitId),
  });
};

export const useAllOutlets = (enabled = true) => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.outletList);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "outlets"),
    queryFn: ({ signal }) =>
      requestInSession(session.id, () => {
        assertAccess(session.id, ACCESS.outletList);
        return getAllOutlets(undefined, signal);
      }),
    enabled: enabled && session.enabled && access.allowed,
  });
};

export function useOutlet(id: number, enabled = true) {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.outletDetail);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "outlet", id),
    queryFn: ({ signal }) =>
      requestInSession(session.id, () => {
        assertAccess(session.id, ACCESS.outletDetail);
        return getOutletById(id, signal);
      }),
    enabled:
      enabled && session.enabled && access.allowed && isValidEntityId(id),
  });
}

async function synchronizeOutlet(
  client: QueryClient,
  sessionId: number,
  id: number,
  deleted = false,
) {
  assertSession(sessionId);
  // Organization counts, User outlet lookups, and loaded User relations may include this Outlet.
  const related = {
    predicate: (query: {
      queryKey: readonly unknown[];
      meta?: Record<string, unknown>;
    }) => {
      const key = query.queryKey;
      return (
        query.meta?.scope !== "global" &&
        key[0] === "session" &&
        key[1] === sessionId &&
        (["outlets", "organization-units", "organization-unit", "users", "user"].includes(
          String(key[2]),
        ) ||
          (key[2] === "outlet" && key[3] === id))
      );
    },
  };
  await client.cancelQueries(related);
  assertSession(sessionId);
  if (deleted)
    client.removeQueries({
      queryKey: sessionQueryKey(sessionId, "outlet", id),
      exact: true,
    });
  await client.invalidateQueries({ ...related, refetchType: "none" });
  assertSession(sessionId);
  await client.refetchQueries(
    {
      type: "active",
      predicate: (query) => {
        if (!related.predicate(query)) return false;
        const resource = query.queryKey[2];
        if (resource === "users") return canAccess(ACCESS.userList);
        if (resource === "user") return canAccess(ACCESS.userDetail);
        if (resource === "organization-unit") return canAccess(ACCESS.organizationDetail);
        if (resource === "outlet")
          return !deleted && canAccess(ACCESS.outletDetail);
        if (resource === "outlets" && query.queryKey[3] !== "user-lookup")
          return canAccess(ACCESS.outletList);
        return canAccess(ACCESS.dashboard);
      },
    },
    { throwOnError: true },
  );
}

type SaveOutletInput =
  | { kind: "create"; payload: OutletCreateRequest }
  | { kind: "update"; id: number; payload: OutletUpdateRequest };
function useSaveOutlet() {
  const session = useSessionQuery();
  const client = useQueryClient();
  const busy = useRef(false);
  return useMutation({
    mutationKey: sessionQueryKey(session.id, "save-outlet"),
    meta: session.meta,
    retry: false,
    gcTime: 0,
    mutationFn: async (input: SaveOutletInput) => {
      if (busy.current) throw new Error("Penyimpanan sedang berlangsung.");
      busy.current = true;
      try {
        const result = await requestInSession(session.id, () => {
          assertAccess(
            session.id,
            input.kind === "create" ? ACCESS.outletCreate : ACCESS.outletUpdate,
          );
          if (
            input.kind === "update" &&
            (!isValidEntityId(input.id) || !Object.keys(input.payload).length)
          )
            throw new Error("ID Outlet atau perubahan tidak valid.");
          if (
            input.kind === "update" &&
            Object.prototype.hasOwnProperty.call(input.payload, "code")
          )
            throw new Error(
              "Perubahan kode Outlet belum tersedia sampai validasi backend diperbaiki.",
            );
          return input.kind === "create"
            ? createOutlet(input.payload)
            : updateOutlet(input.id, input.payload);
        });
        let synchronizationFailed = false;
        try {
          await synchronizeOutlet(client, session.id, result.data.id);
        } catch {
          synchronizationFailed = true;
        }
        return {
          id: result.data.id,
          message: result.message,
          synchronizationFailed,
        };
      } finally {
        busy.current = false;
      }
    },
  });
}
export function useCreateOutlet() {
  const mutation = useSaveOutlet();
  return {
    isPending: mutation.isPending,
    mutateAsync: (payload: OutletCreateRequest) =>
      mutation.mutateAsync({ kind: "create", payload }),
  };
}
export function useUpdateOutlet() {
  const mutation = useSaveOutlet();
  return {
    isPending: mutation.isPending,
    mutateAsync: (id: number, payload: OutletUpdateRequest) =>
      mutation.mutateAsync({ kind: "update", id, payload }),
  };
}
export function useDeleteOutlet() {
  const session = useSessionQuery();
  const client = useQueryClient();
  const busy = useRef(false);
  return useMutation({
    mutationKey: sessionQueryKey(session.id, "delete-outlet"),
    meta: session.meta,
    retry: false,
    gcTime: 0,
    mutationFn: async (id: number) => {
      if (busy.current) throw new Error("Penghapusan sedang berlangsung.");
      busy.current = true;
      try {
        const result = await requestInSession(session.id, () => {
          assertAccess(session.id, ACCESS.outletDelete);
          if (!isValidEntityId(id)) throw new Error("ID Outlet tidak valid.");
          return deleteOutlet(id);
        });
        let synchronizationFailed = false;
        try {
          await synchronizeOutlet(client, session.id, id, true);
        } catch {
          synchronizationFailed = true;
        }
        return { message: result.message, synchronizationFailed };
      } finally {
        busy.current = false;
      }
    },
  });
}

export function useCheckOutletWrite() {
  const session = useSessionQuery();
  return async (payload: OutletUpdateRequest, id?: number) => {
    if (id !== undefined && !isValidEntityId(id))
      throw new Error("ID Outlet tidak valid.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const rows = await requestInSession(session.id, () => {
        assertAccess(
          session.id,
          id === undefined ? ACCESS.outletList : ACCESS.outletDetail,
        );
        return id === undefined
          ? getAllOutlets(undefined, controller.signal).then((response) =>
              response.data.filter((outlet) => outlet.code === payload.code),
            )
          : getOutletById(id, controller.signal).then((response) => [
              response.data,
            ]);
      });
      return rows.length === 1
        ? `${outletWriteMatches(rows[0], payload) ? "Field yang dapat dibaca sesuai snapshot percobaan." : "Data terbaca belum sesuai snapshot percobaan."} Pembacaan ini bukan konfirmasi identitas operasi sebelumnya. Hasil masih belum pasti; tidak ada mutation yang diulang.`
        : "Belum ditemukan hasil yang pasti. Request sebelumnya mungkin masih diproses. Tidak ada mutation yang diulang.";
    } finally {
      clearTimeout(timeout);
    }
  };
}
