import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { QueryFilters } from "@tanstack/react-query";
import { getAllRoles, getRoleById, deleteRole, createRole, updateRole, syncRolePermissions, getRoleMenus, syncRoleMenus, RoleDeleteResponseError, RoleWriteResponseError } from "@/services/role.services";
import { useRef } from "react";
import { isValidEntityId } from "@/lib/managementApi";
import { PartialSaveError, readRequestFailure } from "@/lib/managementForm";
import type { Role, RoleCreateRequest, RoleUpdateRequest, RoleAssignmentPhase, RoleSaveProgress } from "@/types/role";
import type { RoleFormDraft } from "@/validations/roleSchema";
import type { UserDetailResponse } from "@/types/userManagement";
import { store } from "@/store/store";
import { verifySession } from "@/lib/sessionVerification";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { assertSession, captureSession, getSessionSnapshot, isCurrentSession, requestInSession, setSessionStatus } from "@/lib/session";
import { ACCESS, assertAccess, isForbidden } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";
import axios from "axios";
import { toast } from "sonner";

export const useRoles = (complete = false) => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.roleList);
  return useQuery({
    ...session,
    queryKey: complete ? sessionQueryKey(session.id, "roles", "lookup") : sessionQueryKey(session.id, "roles"),
    queryFn: () => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.roleList);
      return getAllRoles();
    }),
    enabled: session.enabled && access.allowed,
  });
};

export const useRole = (id?: number | string) => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.roleDetail);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "role", id),
    queryFn: () => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.roleDetail);
      return getRoleById(id!);
    }),
    enabled: session.enabled && access.allowed && isValidEntityId(typeof id === "string" ? Number(id) : id),
  });
};

export const useRoleMenus = (id: number) => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.roleDetail);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "role-menus", id),
    queryFn: () => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.roleDetail);
      return getRoleMenus(id);
    }),
    enabled: session.enabled && access.allowed && isValidEntityId(id),
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const session = useSessionQuery();
  const busy = useRef(false);
  type Target = Pick<Role, "id" | "is_system">;
  type Input = Target & { affectsCurrentUser: boolean };

  const synchronize = async ({ id, affectsCurrentUser }: Input, deleted: boolean) => {
    try { assertSession(session.id); } catch { return; }
    const context = captureSession();
    const wasVerifying = getSessionSnapshot().status === "verifying";
    const isRoleDetail = (key: readonly unknown[]) => (key[2] === "role" || key[2] === "role-menus") && (key[3] === id || key[3] === String(id));
    const related: QueryFilters = {
      predicate: (query) => {
        const key = query.queryKey;
        if (query.meta?.scope === "global" || key[0] !== "session" || key[1] !== session.id) return false;
        if (key[2] === "roles" || key[2] === "users" || isRoleDetail(key)) return true;
        if (key[2] === "user") {
          const response = query.state.data as UserDetailResponse | undefined;
          return query.state.fetchStatus === "fetching" || !Array.isArray(response?.data?.roles) ||
            response.data.roles.some((role) => role.id === id);
        }
        return affectsCurrentUser && (key[2] === "me" || key[2] === "menu-tree");
      },
    };
    // Block old permissions while cancellation and profile reconciliation are in progress.
    if (affectsCurrentUser) setSessionStatus(context, "verifying");
    try {
      await queryClient.cancelQueries(related);
      assertSession(session.id);
      queryClient.removeQueries({ predicate: (query) => related.predicate!(query) &&
        ((deleted && isRoleDetail(query.queryKey)) || query.queryKey[2] === "me" || query.queryKey[2] === "menu-tree") });
      await queryClient.invalidateQueries({ ...related, refetchType: "none" });
    } catch {
      if (isCurrentSession(context)) toast.warning("Cache terkait belum dapat disinkronkan. Muat ulang data sebelum melakukan aksi berikutnya.");
    }
    if (!isCurrentSession(context)) return;
    if (affectsCurrentUser) {
      await verifySession(context);
      // An existing verification may have read the profile before DELETE completed.
      if (wasVerifying && isCurrentSession(context) && getSessionSnapshot().status === "valid") await verifySession(context);
      if (isCurrentSession(context) && getSessionSnapshot().status === "failed") {
        toast.warning(deleted ? "Role sudah tidak tersedia, tetapi sesi belum dapat diverifikasi ulang. Gunakan Coba lagi pada halaman verifikasi sesi." :
          "Hasil penghapusan dan sesi perlu diperiksa kembali. Gunakan Coba lagi pada halaman verifikasi sesi.");
      }
    }
    if (!isCurrentSession(context)) return;
    try {
      await queryClient.refetchQueries({ ...related, type: "active" }, { throwOnError: true });
    } catch {
      if (isCurrentSession(context)) toast.warning("Data terkait belum berhasil dimuat ulang. Periksa koneksi dan muat ulang halaman.");
    }
  };
  const mutation = useMutation({
    mutationKey: sessionQueryKey(session.id, "delete-role"),
    meta: session.meta, retry: false, gcTime: 0,
    mutationFn: (input: Input) => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.roleDelete);
      if (!isValidEntityId(input.id) || input.is_system !== false) throw new Error("Role tidak valid atau merupakan system Role.");
      return deleteRole(input.id);
    }),
    onError: async (error, input) => {
      try { assertSession(session.id); } catch { return; }
      if (axios.isCancel(error)) return;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const body: unknown = axios.isAxiosError(error) ? error.response?.data : undefined;
      const validationMessage = status === 422 && body && typeof body === "object" && "message" in body &&
        typeof body.message === "string" ? body.message.trim().slice(0, 500) : undefined;
      toast.error(isForbidden(error) ? "Akses ditolak. Anda tidak memiliki izin untuk menghapus role." :
        status === 404 ? "Role sudah tidak tersedia. Daftar role dimuat ulang." :
        status === 422 ? validationMessage || "Penghapusan role ditolak oleh server." :
        status === 401 ? "Sesi telah berakhir. Silakan login kembali." :
        !isValidEntityId(input.id) || input.is_system !== false ? "Role tidak valid atau merupakan system Role." :
        error instanceof RoleDeleteResponseError ? error.message :
        "Penghapusan belum dapat dikonfirmasi. Daftar dimuat ulang; periksa sebelum mencoba lagi.");
      if (error instanceof RoleDeleteResponseError ||
        (axios.isAxiosError(error) && (!error.response || status === 404 || (status !== undefined && status >= 500)))) {
        // A timeout can follow a committed delete; reconcile without retrying DELETE.
        await synchronize(input, status === 404);
      }
    },
    onSuccess: async (response, input) => {
      try { assertSession(session.id); } catch { return; }
      // Keep feedback outside the page: session verification can unmount its guard.
      toast.success(typeof response.message === "string" && response.message.trim() ?
        response.message.trim().slice(0, 500) : "Role berhasil dihapus.");
      await synchronize(input, true);
    },
  });
  return {
    isPending: mutation.isPending,
    mutateAsync: async (target: Target) => {
      if (busy.current) throw new axios.CanceledError("Penghapusan sedang berlangsung.");
      busy.current = true;
      try {
        assertSession(session.id);
        const auth = store.getState().auth;
        return await mutation.mutateAsync({ ...target,
          affectsCurrentUser: auth.roles.some((role) => role.id === target.id) ||
            !!auth.user?.roles.some((role) => role.id === target.id),
        });
      } finally { busy.current = false; }
    },
  };
};

export type SaveRoleInput = (
  { mode: "create"; payload: RoleCreateRequest } |
  { mode: "update"; id: number; payload: RoleUpdateRequest }
) & { permissionIds?: number[]; menuIds?: number[]; resume?: RoleSaveProgress };

export const roleCreateDraftKey = (sessionId: number) => sessionQueryKey(sessionId, "role-form", "create");
export const roleUpdateDraftKey = (sessionId: number, id: number) => sessionQueryKey(sessionId, "role-form", "update", id);

export function useSaveRole() {
  const session = useSessionQuery();
  const client = useQueryClient();
  const busy = useRef(false);
  type Input = SaveRoleInput & { affectsCurrentUser: boolean };
  const draftKey = (input: SaveRoleInput) => input.mode === "create" ? roleCreateDraftKey(session.id) : roleUpdateDraftKey(session.id, input.id);
  const updateDraft = (input: SaveRoleInput, changes: Partial<RoleFormDraft>) => {
    assertSession(session.id);
    client.setQueryData<RoleFormDraft>(draftKey(input), (draft) => draft ? { ...draft, ...changes } : undefined);
  };
  const synchronize = async (input: Input, id?: number) => {
    try { assertSession(session.id); } catch { return; }
    const context = captureSession();
    const wasVerifying = getSessionSnapshot().status === "verifying";
    const related: QueryFilters = { predicate: (query) => {
      const key = query.queryKey;
      if (query.meta?.scope === "global" || key[0] !== "session" || key[1] !== session.id) return false;
      if (key[2] === "roles" || key[2] === "users") return true;
      if ((key[2] === "role" || key[2] === "role-menus") && (key[3] === id || key[3] === String(id))) return true;
      if (key[2] === "user" && id) {
        const response = query.state.data as UserDetailResponse | undefined;
        return query.state.fetchStatus === "fetching" || !Array.isArray(response?.data?.roles) || response.data.roles.some((role) => role.id === id);
      }
      return input.affectsCurrentUser && (key[2] === "me" || key[2] === "menu-tree");
    } };
    if (input.affectsCurrentUser) setSessionStatus(context, "verifying");
    try {
      await client.cancelQueries(related);
      assertSession(session.id);
      client.removeQueries({ predicate: (query) => related.predicate!(query) && (query.queryKey[2] === "me" || query.queryKey[2] === "menu-tree") });
      await client.invalidateQueries({ ...related, refetchType: "none" });
    } catch {
      if (isCurrentSession(context)) toast.warning("Data terkait perlu dimuat ulang. Status penyimpanan tetap mengikuti hasil server.");
    }
    if (!isCurrentSession(context)) return;
    if (input.affectsCurrentUser) {
      await verifySession(context);
      if (wasVerifying && isCurrentSession(context) && getSessionSnapshot().status === "valid") await verifySession(context);
      if (isCurrentSession(context) && getSessionSnapshot().status === "failed") toast.warning("Sesi belum dapat diverifikasi ulang. Gunakan Coba lagi pada halaman verifikasi sesi; draft tetap disimpan sementara.");
    }
    if (!isCurrentSession(context)) return;
    try { await client.refetchQueries({ ...related, type: "active" }, { throwOnError: true }); }
    catch { if (isCurrentSession(context)) toast.warning("Pemuatan ulang data terkait gagal. Periksa koneksi; jangan mengulang penyimpanan yang sudah dikonfirmasi."); }
  };
  const mutation = useMutation({
    mutationKey: sessionQueryKey(session.id, "save-role"), meta: session.meta, retry: false, gcTime: 0,
    mutationFn: async (input: Input) => {
      assertAccess(session.id, input.mode === "create" ? ACCESS.roleCreate : ACCESS.roleUpdate);
      const pending: RoleAssignmentPhase[] = [];
      for (const phase of ["menus", "permissions"] as const) {
        const ids = phase === "menus" ? input.menuIds : input.permissionIds;
        if (ids === undefined) continue;
        assertAccess(session.id, phase === "menus" ? ACCESS.roleAssignMenus : ACCESS.roleAssignPermissions);
        if (!ids.length || ids.some((id) => !isValidEntityId(id))) throw new Error("Backend membutuhkan assignment tidak kosong dengan ID valid.");
        pending.push(phase);
      }
      if (input.mode === "update" && !isValidEntityId(input.id)) throw new Error("ID role tidak valid.");
      if (input.resume && (!isValidEntityId(input.resume.entityId) || !input.resume.pending.length ||
        new Set(input.resume.pending).size !== input.resume.pending.length ||
        input.resume.pending.length !== pending.length || input.resume.pending.some((phase) => !pending.includes(phase)) ||
        (input.mode === "update" && input.resume.entityId !== input.id))) throw new Error("Tahap retry tidak sesuai dengan role atau assignment yang belum selesai.");
      if (!input.resume && input.mode === "update" && !Object.keys(input.payload).length && !pending.length) throw new Error("Tidak ada perubahan untuk disimpan.");
      let id = input.resume?.entityId ?? (input.mode === "update" ? input.id : undefined);
      if (!input.resume && (input.mode === "create" || Object.keys(input.payload).length)) {
        const result = await requestInSession(session.id, () => {
          assertAccess(session.id, input.mode === "create" ? ACCESS.roleCreate : ACCESS.roleUpdate);
          return input.mode === "create" ? createRole(input.payload) : updateRole(input.id, input.payload);
        });
        id = result.data.id;
      }
      if (!id) throw new Error("ID role tidak tersedia.");
      while (pending.length) {
        const phase = pending[0];
        updateDraft(input, { progress: { entityId: id, pending: [...pending] } });
        try {
          await requestInSession(session.id, () => {
            assertAccess(session.id, phase === "menus" ? ACCESS.roleAssignMenus : ACCESS.roleAssignPermissions);
            return phase === "menus" ? syncRoleMenus(id!, input.menuIds!) : syncRolePermissions(id!, input.permissionIds!);
          });
        } catch (error: unknown) {
          if (axios.isCancel(error)) throw error;
          throw new PartialSaveError(id, phase, readRequestFailure(error), [...pending]);
        }
        pending.shift();
      }
      return { id };
    },
    onSuccess: async ({ id }, input) => {
      try { assertSession(session.id); } catch { return; }
      updateDraft(input, { complete: true, progress: undefined, issue: undefined, unconfirmed: false });
      toast.success("Role dan seluruh assignment yang diminta berhasil disimpan.");
      await synchronize(input, id);
    },
    onError: async (error, input) => {
      try { assertSession(session.id); } catch { return; }
      if (axios.isCancel(error)) return;
      if (error instanceof PartialSaveError) {
        const pending = error.pendingPhases.filter((phase): phase is RoleAssignmentPhase => phase === "menus" || phase === "permissions");
        updateDraft(input, { progress: { entityId: error.entityId, pending }, issue: error.message });
        toast.error(error.message);
        await synchronize(input, error.entityId);
      } else if (error instanceof RoleWriteResponseError || (axios.isAxiosError(error) && (!error.response || error.response.status >= 500))) {
        const issue = "Hasil penyimpanan data utama belum dapat dipastikan. Periksa daftar/backend sebelum mencoba lagi; assignment lanjutan belum dikirim.";
        updateDraft(input, { issue, unconfirmed: true });
        toast.error(issue);
        await synchronize(input, input.mode === "update" ? input.id : undefined);
      }
    },
  });
  return {
    isPending: mutation.isPending,
    mutateAsync: async (input: SaveRoleInput) => {
      if (busy.current) throw new axios.CanceledError("Penyimpanan sedang berlangsung.");
      busy.current = true;
      try {
        assertSession(session.id);
        const id = input.mode === "update" ? input.id : input.resume?.entityId;
        const auth = store.getState().auth;
        return await mutation.mutateAsync({ ...input, affectsCurrentUser: !!id &&
          (auth.roles.some((role) => role.id === id) || !!auth.user?.roles.some((role) => role.id === id)) });
      } finally { busy.current = false; }
    },
  };
}

export function useCreateRole() {
  const mutation = useSaveRole();
  return {
    isPending: mutation.isPending,
    mutateAsync: (input: Omit<Extract<SaveRoleInput, { mode: "create" }>, "mode">) =>
      mutation.mutateAsync({ ...input, mode: "create" }),
  };
}

export function useUpdateRole() {
  const mutation = useSaveRole();
  return {
    isPending: mutation.isPending,
    mutateAsync: (input: Omit<Extract<SaveRoleInput, { mode: "update" }>, "mode">) =>
      mutation.mutateAsync({ ...input, mode: "update" }),
  };
}
