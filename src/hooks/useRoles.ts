import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getAllRoles, getRoleById, deleteRole, createRole, updateRole, syncRolePermissions } from "@/services/role.services";
import { useRef } from "react";
import { isValidEntityId } from "@/lib/managementApi";
import { PartialSaveError, readRequestFailure } from "@/lib/managementForm";
import type { RoleCreateRequest, RoleUpdateRequest } from "@/types/role";
import { store } from "@/store/store";
import { verifySession } from "@/lib/sessionVerification";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { assertSession, requestInSession } from "@/lib/session";
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

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const session = useSessionQuery();

  return useMutation({
    mutationKey: sessionQueryKey(session.id, "delete-role"),
    meta: session.meta,
    mutationFn: (id: number) => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.roleDelete);
      return deleteRole(id);
    }),
    onError: (error) => {
      try { assertSession(session.id); } catch { return; }
      if (axios.isCancel(error)) return;
      toast.error(isForbidden(error) ? "Anda tidak memiliki izin untuk menghapus role." : "Role gagal dihapus. Silakan coba lagi.");
    },
    onSuccess: () => {
      try { assertSession(session.id); } catch { return; }
      queryClient.invalidateQueries({
        queryKey: sessionQueryKey(session.id, "roles"),
      });
    },
  });
};

export type SaveRoleInput = (
  { mode: "create"; payload: RoleCreateRequest } |
  { mode: "update"; id: number; payload: RoleUpdateRequest }
) & { permissionIds?: number[]; resumeId?: number };

export function useSaveRole() {
  const session = useSessionQuery();
  const client = useQueryClient();
  const busy = useRef(false);
  const invalidate = async (id?: number) => {
    try { assertSession(session.id); } catch { return; }
    await client.invalidateQueries({ queryKey: sessionQueryKey(session.id, "roles") });
    if (id) await client.invalidateQueries({ queryKey: sessionQueryKey(session.id, "role", id) });
  };
  return useMutation({
    mutationKey: sessionQueryKey(session.id, "save-role"), meta: session.meta, retry: false, gcTime: 0,
    mutationFn: async (input: SaveRoleInput) => {
      if (busy.current) throw new Error("Penyimpanan sedang berlangsung.");
      busy.current = true;
      try {
        assertAccess(session.id, input.mode === "create" ? ACCESS.roleCreate : ACCESS.roleUpdate);
        if (input.permissionIds !== undefined) {
          assertAccess(session.id, ACCESS.roleAssignPermissions);
          if (!input.permissionIds.length || input.permissionIds.some((id) => !isValidEntityId(id))) throw new Error("Backend membutuhkan minimal satu permission untuk sync.");
        }
        if (input.mode === "update" && !isValidEntityId(input.id)) throw new Error("ID role tidak valid.");
        if (input.resumeId !== undefined && !isValidEntityId(input.resumeId)) throw new Error("ID retry tidak valid.");
        if (input.mode === "update" && input.resumeId !== undefined && input.resumeId !== input.id) throw new Error("ID retry berbeda dari role yang diedit.");
        let id = input.resumeId ?? (input.mode === "update" ? input.id : undefined);
        if (input.resumeId === undefined && (input.mode === "create" || Object.keys(input.payload).length)) {
          const result = await requestInSession(session.id, () => {
            assertAccess(session.id, input.mode === "create" ? ACCESS.roleCreate : ACCESS.roleUpdate);
            return input.mode === "create" ? createRole(input.payload) : updateRole(input.id, input.payload);
          });
          id = result.data.id;
        }
        if (!id) throw new Error("ID role tidak tersedia.");
        if (input.permissionIds !== undefined) {
          try {
            await requestInSession(session.id, () => {
              assertAccess(session.id, ACCESS.roleAssignPermissions);
              return syncRolePermissions(id!, input.permissionIds!);
            });
          } catch (error: unknown) {
            if (axios.isCancel(error)) throw error;
            throw new PartialSaveError(id, "permissions", readRequestFailure(error));
          }
        }
        return { id };
      } finally { busy.current = false; }
    },
    onSuccess: async ({ id }) => {
      await invalidate(id);
      try { assertSession(session.id); } catch { return; }
      if (store.getState().auth.roles.some((role) => role.id === id)) await verifySession();
    },
    onError: async (error) => { if (error instanceof PartialSaveError) await invalidate(error.entityId); },
  });
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
