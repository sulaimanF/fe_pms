import { useQuery } from "@tanstack/react-query";
import { getPermissions } from "@/services/permissions.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";

export const usePermissions = () => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "permissions"),
    queryFn: () => requestInSession(session.id, getPermissions),
  });
};
