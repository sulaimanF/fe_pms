"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useSessionQuery } from "@/hooks/useAuth";
import { useParameterAccess } from "@/hooks/useParameterAccess";
import { sessionQueryKey } from "@/lib/queryClient";
import { assertSession, requestInSession } from "@/lib/session";
import {
  assertParameterAccess,
  canManageParameters,
} from "@/lib/parameterAuthorization";
import { isValidEntityId } from "@/lib/managementApi";
import {
  createParameter,
  deleteParameter,
  getParameterDetail,
  getParameterList,
  getSurveyContexts,
  updateParameter,
} from "@/services/parameterPenilaian.services";
import type { ApiResponse } from "@/types/common";
import type {
  ParameterFilters,
  ParameterRequests,
  ParameterResource,
} from "@/types/parameterPenilaian";

export function useSurveyContexts() {
  const session = useSessionQuery(),
    access = useParameterAccess();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "parameters", "survey-contexts"),
    enabled: session.enabled && access.allowed,
    queryFn: ({ signal }) =>
      requestInSession(session.id, () => {
        assertParameterAccess(session.id);
        return getSurveyContexts(signal);
      }),
  });
}
export function useParameterList<K extends ParameterResource>(
  resource: K,
  filters: ParameterFilters = {},
  enabled = true,
) {
  const session = useSessionQuery(),
    access = useParameterAccess();
  const valid =
    Object.values(filters).every(
      (value) => value === undefined || isValidEntityId(value),
    ) &&
    (!["configurations", "options", "ranges"].includes(resource) ||
      isValidEntityId(filters.parentId));
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(
      session.id,
      "parameters",
      resource,
      "list",
      filters,
    ),
    enabled: session.enabled && access.allowed && enabled && valid,
    queryFn: ({ signal }) =>
      requestInSession(session.id, () => {
        assertParameterAccess(session.id);
        return getParameterList(resource, filters, signal);
      }),
  });
}
export function useParameterDetail<K extends ParameterResource>(
  resource: K,
  id: number,
  enabled = true,
) {
  const session = useSessionQuery(),
    access = useParameterAccess();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "parameters", resource, "detail", id),
    enabled:
      session.enabled && access.allowed && enabled && isValidEntityId(id),
    queryFn: ({ signal }) =>
      requestInSession(session.id, () => {
        assertParameterAccess(session.id);
        return getParameterDetail(resource, id, signal);
      }),
  });
}
const dependencies: Record<ParameterResource, readonly ParameterResource[]> = {
  sections: ["sections", "questions", "configurations"],
  configurations: ["configurations", "sections"],
  periods: ["periods", "configurations", "sections"],
  questions: ["questions", "sections", "options"],
  options: ["options", "questions", "sections"],
  methods: ["methods", "ranges"],
  ranges: ["ranges", "methods"],
};
export async function synchronizeParameters(
  client: QueryClient,
  sessionId: number,
  resource: ParameterResource,
) {
  assertParameterAccess(sessionId);
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
        key[2] === "parameters" &&
        dependencies[resource].includes(key[3] as ParameterResource)
      );
    },
  };
  await client.cancelQueries(related);
  assertSession(sessionId);
  await client.invalidateQueries({ ...related, refetchType: "none" });
  assertSession(sessionId);
  await client.refetchQueries(
    {
      type: "active",
      predicate: (query) => related.predicate(query) && canManageParameters(),
    },
    { throwOnError: true },
  );
}
function useParameterMutation<I, T>(
  resource: ParameterResource,
  execute: (input: I) => Promise<ApiResponse<T>>,
) {
  const session = useSessionQuery(),
    client = useQueryClient(),
    busy = useRef(false);
  return useMutation({
    mutationKey: sessionQueryKey(session.id, "parameters", resource, "write"),
    meta: session.meta,
    retry: false,
    gcTime: 0,
    mutationFn: async (input: I) => {
      if (busy.current) throw new Error("Operasi sedang berlangsung.");
      busy.current = true;
      try {
        const response = await requestInSession(session.id, () => {
          assertParameterAccess(session.id);
          return execute(input);
        });
        let synchronizationFailed = false;
        try {
          await synchronizeParameters(client, session.id, resource);
        } catch {
          synchronizationFailed = true;
        }
        return { response, synchronizationFailed };
      } finally {
        busy.current = false;
      }
    },
  });
}
export function useCreateParameter<K extends ParameterResource>(
  resource: K,
  parentId?: number,
) {
  return useParameterMutation(resource, (payload: ParameterRequests[K]) => {
    if (
      resource === "methods" &&
      "method_type" in payload &&
      payload.method_type === "formula"
    )
      throw new Error("Formula belum didukung engine.");
    return createParameter(resource, payload, parentId);
  });
}
export function useUpdateParameter<K extends ParameterResource>(
  resource: K,
  id: number,
) {
  return useParameterMutation(
    resource,
    (payload: Partial<ParameterRequests[K]>) => {
      if (!Object.keys(payload).length)
        throw new Error("Tidak ada perubahan untuk disimpan.");
      if (
        resource === "methods" &&
        "method_type" in payload &&
        payload.method_type === "formula"
      )
        throw new Error("Perubahan ke formula belum didukung engine.");
      return updateParameter(resource, id, payload);
    },
  );
}
export function useDeleteParameter(resource: ParameterResource) {
  return useParameterMutation(resource, (id: number) =>
    deleteParameter(resource, id),
  );
}
