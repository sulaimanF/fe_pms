import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/services/userManagement.services";
import { getUserById } from "@/services/userManagement.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";

export const useUsers = () => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "users"),
    queryFn: () => requestInSession(session.id, getUsers),
  });
};

export const useUser = (id: number) => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "user", id),
    queryFn: () => requestInSession(session.id, () => getUserById(id)),
    enabled: session.enabled && !!id,
  });
};
