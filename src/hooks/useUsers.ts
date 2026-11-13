import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient, QueryFilters } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getAllUsers, createUser, updateUser, deleteUser, verifyUserWriteContract, UserWriteUncertainError, UserDeleteResponseError } from "@/services/userManagement.services";
import { getUserById } from "@/services/userManagement.services";
import { getUserPermissions, createUserPermission, updateUserPermission, deleteUserPermission } from "@/services/userManagement.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession, assertSession, captureSession, isCurrentSession } from "@/lib/session";
import { isValidEntityId } from "@/lib/managementApi";
import type { UserCreateRequest, UserUpdateRequest } from "@/types/userManagement";
import type { UserPermissionMutation, UserPermissionsResponse, UserPermissionResponse } from "@/types/userManagement";
import type { ApiResponse } from "@/types/common";
import { userPermissionCreateRequestSchema, userPermissionUpdateRequestSchema } from "@/validations/userPermissionSchema";
import { store } from "@/store/store";
import { verifySession } from "@/lib/sessionVerification";
import { ACCESS, assertAccess, assertManageUserBypass, canAccess, isForbidden } from "@/lib/authorization";
import { describeUserWriteCheck } from "@/lib/userWriteRecovery";
import type { UserWriteAttempt } from "@/lib/userWriteRecovery";
import { useAuthorization } from "@/hooks/useAuthorization";
import { getAllOutlets } from "@/services/outlet.service";
import axios from "axios";

// All list variants and detail entries may contain membership/count data for old and new roles.
// Do not include role-form drafts, role-menus, global caches, or another account's session.
async function synchronizeUserRoleCache(client: QueryClient, sessionId: number) {
  assertSession(sessionId);
  const related: QueryFilters = { predicate: (query) => {
    const key = query.queryKey;
    return query.meta?.scope !== "global" && key[0] === "session" && key[1] === sessionId &&
      (key[2] === "roles" || key[2] === "role");
  } };
  // A pre-write read must not later mark the old count as fresh.
  await client.cancelQueries(related);
  assertSession(sessionId);
  await client.invalidateQueries({ ...related, refetchType: "none" });
  assertSession(sessionId);
  await client.refetchQueries({ type: "active", predicate: (query) => related.predicate!(query) &&
    canAccess(query.queryKey[2] === "roles" ? ACCESS.roleList : ACCESS.roleDetail),
  }, { throwOnError: true });
}

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
  const invalidate = async (id: number, roleAssignmentConfirmed: boolean) => {
    assertSession(session.id);
    const results = await Promise.allSettled([
      client.invalidateQueries({ queryKey: sessionQueryKey(session.id, "users") }, { throwOnError: true }),
      client.invalidateQueries({ queryKey: sessionQueryKey(session.id, "user", id) }, { throwOnError: true }),
      ...(roleAssignmentConfirmed ? [synchronizeUserRoleCache(client, session.id)] : []),
    ]);
    return results.some((result) => result.status === "rejected");
  };
  return useMutation({
    mutationKey: sessionQueryKey(session.id, "save-user"), meta: session.meta, retry: false, gcTime: 0,
    mutationFn: async (input: SaveUserInput) => {
      if (busy.current) throw new Error("Penyimpanan sedang berlangsung.");
      busy.current = true;
      const assertWriteAccess = () => {
        assertAccess(session.id, input.mode === "create" ? ACCESS.userCreate : ACCESS.userUpdate);
        if (Object.prototype.hasOwnProperty.call(input.payload, "is_bypass")) {
          assertManageUserBypass(session.id);
          if (typeof input.payload.is_bypass !== "boolean") throw new Error("Nilai bypass harus berupa boolean.");
        }
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
        // The write is already confirmed. A read/cache failure cannot turn it into a failed save.
        let synchronizationFailed = false;
        try {
          synchronizationFailed = await invalidate(result.data.id, input.mode === "create" || input.payload.role_ids !== undefined);
          assertSession(session.id);
          if (store.getState().auth.user?.id === result.data.id) await verifySession();
        } catch { synchronizationFailed = true; }
        return { id: result.data.id, message: result.message, synchronizationFailed };
      } finally { busy.current = false; }
    },
  });
}

interface UserRecoveryState {
  attempt: UserWriteAttempt;
  sessionId: number;
  candidateId?: number;
  notice: string;
}

// Shared read-only recovery; it never creates, updates, assigns, or resets a form.
export function useUserWriteRecovery(targetId?: number) {
  const session = useSessionQuery();
  const client = useQueryClient();
  const [state, setState] = useState<UserRecoveryState>();
  const [checking, setChecking] = useState(false);
  const current = useRef<UserRecoveryState | undefined>(undefined);
  const running = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; current.current = undefined; };
  }, [session.id, targetId]);
  const active = state?.sessionId === session.id && state.attempt.id === targetId ? state : undefined;
  const record = (attempt: UserWriteAttempt, error: UserWriteUncertainError) => {
    const next = { attempt, sessionId: session.id, candidateId: error.entityId, notice: error.message };
    current.current = next;
    setState(next);
  };
  const check = async () => {
    const owner = current.current;
    if (!owner || owner.sessionId !== session.id || owner.attempt.id !== targetId || running.current) return;
    const context = captureSession();
    if (!isCurrentSession(context) || context.id !== session.id) return;
    running.current = true;
    setChecking(true);
    const controller = new AbortController();
    // Bound the entire explicit check, including an all-page create lookup.
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const ownsResult = () => mounted.current && current.current === owner && isCurrentSession(context);
    try {
      const attempt = owner.attempt;
      const id = attempt.kind === "update" ? attempt.id : owner.candidateId;
      let notice: string;
      if (isValidEntityId(id)) {
        assertAccess(session.id, ACCESS.userDetail);
        const key = sessionQueryKey(session.id, "user", id);
        await client.cancelQueries({ queryKey: key, exact: true });
        const response = await client.fetchQuery({
          queryKey: key, meta: session.meta, staleTime: 0, retry: false,
          queryFn: ({ signal }) => requestInSession(session.id, () => {
            assertAccess(session.id, ACCESS.userDetail);
            const abort = () => controller.abort();
            if (signal.aborted) controller.abort();
            else signal.addEventListener("abort", abort, { once: true });
            return getUserById(id, controller.signal).finally(() => signal.removeEventListener("abort", abort));
          }),
        });
        if (response.data.id !== id) throw new Error("Detail User tidak sesuai.");
        notice = describeUserWriteCheck(response.data, attempt);
      } else {
        assertAccess(session.id, ACCESS.userList);
        // Existing all-page reader: a missing first-page match is never proof of absence.
        const response = await requestInSession(session.id, () => getAllUsers(controller.signal));
        const candidates = response.data.filter((user) => user.username === attempt.expected.username || user.email === attempt.expected.email);
        notice = candidates.length === 1 ? describeUserWriteCheck(candidates[0], attempt) : candidates.length > 1
          ? "Ditemukan beberapa kandidat dengan username/email percobaan. Identitas ambigu; tidak ada akun yang diubah atau diberi assignment. Hasil masih belum pasti."
          : "Belum ditemukan kandidat pada seluruh halaman yang berhasil dibaca. Ini tidak membuktikan request gagal; request sebelumnya mungkin masih diproses. Hasil masih belum pasti.";
      }
      if (ownsResult()) setState({ ...owner, notice });
    } catch (error: unknown) {
      if (!ownsResult()) return;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const notice = isForbidden(error) ? "Akses pemeriksaan hasil ditolak. Ini bukan bukti User belum tersimpan. Hasil masih belum pasti." :
        status === 401 ? "Sesi tidak berlaku. Pemeriksaan tidak dapat dilanjutkan." :
        status === 404 ? "Detail belum ditemukan. Ini belum membuktikan request sebelumnya gagal. Hasil masih belum pasti." :
        "Pemeriksaan hasil gagal atau data tidak lengkap. Hasil penyimpanan masih belum pasti. Coba periksa kembali tanpa mengulang penyimpanan.";
      setState({ ...owner, notice });
    } finally {
      clearTimeout(timeout);
      running.current = false;
      if (ownsResult()) setChecking(false);
    }
  };
  const release = () => {
    if (running.current || !canAccess(ACCESS.dashboard)) return false;
    current.current = undefined;
    setState(undefined);
    return true;
  };
  return { blocked: !!active, checking, notice: active?.notice ?? "", record, check, release };
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
