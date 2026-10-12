import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getRoles, getRoleById, deleteRole} from "@/services/role.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { assertSession, requestInSession } from "@/lib/session";
import { ACCESS, assertAccess, isForbidden } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";
import axios from "axios";
import { toast } from "sonner";

export const useRoles = () => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.roleList);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "roles"),
    queryFn: () => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.roleList);
      return getRoles();
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
    enabled: session.enabled && access.allowed && !!id,
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
