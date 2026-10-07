import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getRoles, getRoleById, deleteRole} from "@/services/role.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { assertSession, requestInSession } from "@/lib/session";

export const useRoles = () => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "roles"),
    queryFn: () => requestInSession(session.id, getRoles),
  });
};

export const useRole = (id?: number | string) => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "role", id),
    queryFn: () => requestInSession(session.id, () => getRoleById(id!)),
    enabled: session.enabled && !!id,
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const session = useSessionQuery();

  return useMutation({
    mutationKey: sessionQueryKey(session.id, "delete-role"),
    meta: session.meta,
    mutationFn: (id: number) => requestInSession(session.id, () => deleteRole(id)),
    onSuccess: () => {
      try { assertSession(session.id); } catch { return; }
      queryClient.invalidateQueries({
        queryKey: sessionQueryKey(session.id, "roles"),
      });
    },
  });
};
