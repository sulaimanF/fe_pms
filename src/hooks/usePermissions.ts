import { useQuery } from "@tanstack/react-query";
import { getPermissions } from "@/services/permissions.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";
import { ACCESS, assertAccess } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";

export const usePermissions = () => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.permissionCatalog);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "permissions"),
    queryFn: () => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.permissionCatalog);
      return getPermissions();
    }),
    enabled: session.enabled && access.allowed,
  });
};
