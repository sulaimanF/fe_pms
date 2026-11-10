import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { getAllUsers, createUser, updateUser, deleteUser, verifyUserWriteContract, UserWriteContractError, UserDeleteResponseError } from "@/services/userManagement.services";
import { getUserById } from "@/services/userManagement.services";
import { getUserPermissions, createUserPermission, updateUserPermission, deleteUserPermission } from "@/services/userManagement.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession, assertSession } from "@/lib/session";
import { isValidEntityId } from "@/lib/managementApi";
import type { UserCreateRequest, UserUpdateRequest } from "@/types/userManagement";
import type { UserPermissionMutation, UserPermissionsResponse, UserPermissionResponse } from "@/types/userManagement";
import type { ApiResponse } from "@/types/common";
import { userPermissionCreateRequestSchema, userPermissionUpdateRequestSchema } from "@/validations/userPermissionSchema";
import { store } from "@/store/store";
import { verifySession } from "@/lib/sessionVerification";
import { ACCESS, assertAccess } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";
import { getAllOutlets } from "@/services/outlet.service";
import axios from "axios";

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

export function useDeleteUser() {
  const session = useSessionQuery();
  const client = useQueryClient();
  const busy = useRef(false);
  const refresh = async (id: number, deleted: boolean) => {
    try { assertSession(session.id); } catch { return; }
    const detailKey = sessionQueryKey(session.id, "user", id);
    if (deleted) {
      await Promise.all([
        client.cancelQueries({ queryKey: detailKey, exact: true }),
        client.cancelQueries({ queryKey: sessionQueryKey(session.id, "user-permissions", id), exact: true }),
      ]);
      try { assertSession(session.id); } catch { return; }
      client.removeQueries({ queryKey: detailKey, exact: true });
      client.removeQueries({ queryKey: sessionQueryKey(session.id, "user-permissions", id), exact: true });
    }
    await Promise.all([
      client.invalidateQueries({ queryKey: sessionQueryKey(session.id, "users") }),
      client.invalidateQueries({ queryKey: sessionQueryKey(session.id, "roles") }),
      ...(!deleted ? [client.invalidateQueries({ queryKey: detailKey, exact: true })] : []),
    ]);
  };
  const mutation = useMutation({
    mutationKey: sessionQueryKey(session.id, "delete-user"), meta: session.meta, retry: false, gcTime: 0,
    mutationFn: (id: number) => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.userDelete);
      if (!isValidEntityId(id)) throw new Error("ID user tidak valid.");
      if (store.getState().auth.user?.id === id) throw new Error("Anda tidak dapat menghapus akun sendiri.");
      return deleteUser(id);
    }),
    onSuccess: async (_response, id) => { await refresh(id, true); },
    onError: async (error, id) => {
      if (axios.isCancel(error)) return;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (error instanceof UserDeleteResponseError ||
        (axios.isAxiosError(error) && (!error.response || status === 404 || (status !== undefined && status >= 500)))) {
        // A lost response can follow a committed delete; reconcile without retrying DELETE.
        await refresh(id, status === 404);
      }
    },
  });
  return {
    isPending: mutation.isPending,
    mutateAsync: async (id: number) => {
      if (busy.current) throw new Error("Penghapusan sedang berlangsung.");
      busy.current = true;
      try { return await mutation.mutateAsync(id); } finally { busy.current = false; }
    },
  };
}

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
        if (input.payload.role_ids && input.payload.role_ids.length > 1) throw new Error("Pilih maksimal satu role untuk user.");
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

export function useUserPermissions(userId: number, enabled = true) {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.userDetail);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "user-permissions", userId),
    queryFn: ({ signal }) => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.userDetail);
      return getUserPermissions(userId, signal);
    }),
    enabled: enabled && session.enabled && access.allowed && isValidEntityId(userId),
  });
}

export function useMutateUserPermission(userId: number) {
  const session = useSessionQuery();
  const client = useQueryClient();
  const busy = useRef(false);
  const key = sessionQueryKey(session.id, "user-permissions", userId);
  const mutation = useMutation({
    mutationKey: sessionQueryKey(session.id, "write-user-permission", userId),
    meta: session.meta, retry: false, gcTime: 0,
    mutationFn: (input: UserPermissionMutation) => requestInSession<UserPermissionResponse | ApiResponse<null>>(session.id, () => {
      assertAccess(session.id, ACCESS.userManagePermissions);
      if (!isValidEntityId(userId)) throw new Error("ID User tidak valid.");
      if (store.getState().auth.user?.id === userId) throw new Error("Permission khusus akun sendiri tidak boleh diubah.");
      if (input.kind === "create") return createUserPermission(userId, userPermissionCreateRequestSchema.parse(input.payload));
      if (!isValidEntityId(input.permissionId)) throw new Error("ID permission tidak valid.");
      if (input.kind === "delete") return deleteUserPermission(userId, input.permissionId);
      const payload = userPermissionUpdateRequestSchema.parse(input.payload);
      if (!Object.keys(payload).length) throw new Error("Tidak ada perubahan permission untuk disimpan.");
      return updateUserPermission(userId, input.permissionId, payload);
    }),
    onSuccess: async (response, input) => {
      try {
        assertSession(session.id);
        // Stop an older read from replacing this confirmed write.
        await client.cancelQueries({ queryKey: key, exact: true });
        assertSession(session.id);
        const row = response.data;
        client.setQueryData<UserPermissionsResponse>(key, (previous) => {
          if (!previous) return previous;
          const permissionId = input.kind === "create" ? input.payload.permission_id : input.permissionId;
          const rows = previous.data.filter((item) => item.permission_id !== permissionId);
          return { ...previous, data: input.kind === "delete" || !row ? rows : [...rows, row].sort((a, b) => a.code.localeCompare(b.code)) };
        });
        await client.invalidateQueries({ queryKey: key, exact: true, refetchType: "none" });
      } catch {
        // A confirmed write must not become a reported save failure because of cache refresh.
      }
    },
    onError: async () => {
      try { assertSession(session.id); await client.invalidateQueries({ queryKey: key, exact: true, refetchType: "none" }); } catch { return; }
    },
  });
  return {
    isPending: mutation.isPending,
    mutateAsync: async (input: UserPermissionMutation) => {
      if (busy.current) throw new axios.CanceledError("Perubahan permission sedang berlangsung.");
      busy.current = true;
      try { return await mutation.mutateAsync(input); } finally { busy.current = false; }
    },
  };
}
