import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { getAllUsers, createUser, updateUser, verifyUserWriteContract, UserWriteContractError } from "@/services/userManagement.services";
import { getUserById } from "@/services/userManagement.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession, assertSession } from "@/lib/session";
import { isValidEntityId } from "@/lib/managementApi";
import type { UserCreateRequest, UserUpdateRequest } from "@/types/userManagement";
import { store } from "@/store/store";
import { verifySession } from "@/lib/sessionVerification";
import { ACCESS, assertAccess } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";
import { getAllOutlets } from "@/services/outlet.service";

export const useUsers = () => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.userList);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "users"),
    queryFn: () => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.userList);
      return getAllUsers();
    }),
    enabled: session.enabled && access.allowed,
  });
};

export const useUser = (id: number) => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.userDetail);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "user", id),
    queryFn: () => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.userDetail);
      return getUserById(id);
    }),
    enabled: session.enabled && access.allowed && isValidEntityId(id),
  });
};

export const useUserOutletOptions = () => {
  const session = useSessionQuery();
  const access = useAuthorization();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "outlets", "user-lookup"),
    queryFn: () => requestInSession(session.id, () => {
      if (!access.can(ACCESS.userCreate) && !access.can(ACCESS.userUpdate)) {
        assertAccess(session.id, ACCESS.userUpdate);
      }
      return getAllOutlets();
    }),
    enabled: session.enabled && (access.can(ACCESS.userCreate) || access.can(ACCESS.userUpdate)),
  });
};

export type SaveUserInput =
  { mode: "create"; payload: UserCreateRequest } |
  { mode: "update"; id: number; payload: UserUpdateRequest };

export function useSaveUser() {
  const session = useSessionQuery();
  const client = useQueryClient();
  const busy = useRef(false);
  const invalidate = async (id?: number) => {
    try { assertSession(session.id); } catch { return; }
    await client.invalidateQueries({ queryKey: sessionQueryKey(session.id, "users") });
    if (id) await client.invalidateQueries({ queryKey: sessionQueryKey(session.id, "user", id) });
  };
  return useMutation({
    mutationKey: sessionQueryKey(session.id, "save-user"), meta: session.meta, retry: false, gcTime: 0,
    mutationFn: async (input: SaveUserInput) => {
      if (busy.current) throw new Error("Penyimpanan sedang berlangsung.");
      busy.current = true;
      const assertWriteAccess = () => {
        assertAccess(session.id, input.mode === "create" ? ACCESS.userCreate : ACCESS.userUpdate);
        if (input.payload.role_ids !== undefined && (input.mode === "update" || input.payload.role_ids.length > 0)) {
          assertAccess(session.id, ACCESS.userAssignRoles);
        }
      };
      try {
        assertWriteAccess();
        if (input.mode === "update" && !isValidEntityId(input.id)) throw new Error("ID user tidak valid.");
        for (const ids of [input.payload.role_ids, input.payload.outlet_ids]) {
          if (ids !== undefined && ids.some((id) => !isValidEntityId(id))) throw new Error("ID assignment tidak valid.");
        }
        if (input.mode === "update" && !Object.keys(input.payload).length) throw new Error("Tidak ada perubahan untuk disimpan.");
        // A legacy backend must never receive an atomic-write payload it would silently ignore.
        await requestInSession(session.id, verifyUserWriteContract);
        const result = await requestInSession(session.id, () => {
          assertWriteAccess();
          return input.mode === "create" ? createUser(input.payload) : updateUser(input.id, input.payload);
        });
        return { id: result.data.id };
      } finally { busy.current = false; }
    },
    onSuccess: async ({ id }) => {
      await invalidate(id);
      try { assertSession(session.id); } catch { return; }
      if (store.getState().auth.user?.id === id) await verifySession();
    },
    onError: async (error, input) => {
      if (error instanceof UserWriteContractError && error.mayHaveSaved) {
        await invalidate(input.mode === "update" ? input.id : error.entityId);
      }
    },
  });
}

export function useCreateUser() {
  const mutation = useSaveUser();
  return {
    isPending: mutation.isPending,
    mutateAsync: (input: Omit<Extract<SaveUserInput, { mode: "create" }>, "mode">) =>
      mutation.mutateAsync({ ...input, mode: "create" }),
  };
}

export function useUpdateUser() {
  const mutation = useSaveUser();
  return {
    isPending: mutation.isPending,
    mutateAsync: (input: Omit<Extract<SaveUserInput, { mode: "update" }>, "mode">) =>
      mutation.mutateAsync({ ...input, mode: "update" }),
  };
}
