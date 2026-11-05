import { useQuery } from "@tanstack/react-query";
import { getAllMenus, getMenuTree } from "@/services/menu.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";
import { ACCESS, assertAccess } from "@/lib/authorization";
import { useAuthorization } from "@/hooks/useAuthorization";

export const useMenuTree = () => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "menu-tree"),
    queryFn: () => requestInSession(session.id, getMenuTree),
  });
};

export const useMenuCatalog = () => {
  const session = useSessionQuery();
  const access = useAuthorization(ACCESS.menuCatalog);
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "menus", "role-lookup"),
    queryFn: () => requestInSession(session.id, () => {
      assertAccess(session.id, ACCESS.menuCatalog);
      return getAllMenus();
    }),
    enabled: session.enabled && access.allowed,
  });
};
