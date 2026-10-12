import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/services/userManagement.services";
import { getUserById } from "@/services/userManagement.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";
import { ACCESS, assertAccess } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";

export const useUsers = () => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.userList);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "users"),
    queryFn: () => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.userList);
      return getUsers();
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
    enabled: session.enabled && access.allowed && !!id,
  });
};
